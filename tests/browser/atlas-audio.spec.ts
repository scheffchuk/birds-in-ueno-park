import { expect, test, type Page } from "@playwright/test";

type AudioTestState = {
  playCalls: number;
  pauseCalls: number;
  loadCalls: number;
  failNextPlay: boolean;
};

type AtlasAudioWindow = Window & { __atlasAudioTest: AudioTestState };

function getAudioTestState(page: Page) {
  return page.evaluate(
    () => (window as unknown as AtlasAudioWindow).__atlasAudioTest,
  );
}

function card(page: Page, name: string) {
  return page.locator("li").filter({ hasText: name });
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const state: AudioTestState = {
      playCalls: 0,
      pauseCalls: 0,
      loadCalls: 0,
      failNextPlay: false,
    };
    Object.defineProperty(window, "__atlasAudioTest", {
      configurable: true,
      value: state,
    });

    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      configurable: true,
      value: function playStub(this: HTMLMediaElement) {
        state.playCalls += 1;
        if (state.failNextPlay) {
          state.failNextPlay = false;
          this.dispatchEvent(new Event("error"));
          return Promise.reject(new Error("stubbed playback failure"));
        }
        this.dispatchEvent(new Event("playing"));
        return Promise.resolve();
      },
    });
    Object.defineProperty(HTMLMediaElement.prototype, "pause", {
      configurable: true,
      value: function pauseStub(this: HTMLMediaElement) {
        state.pauseCalls += 1;
        this.dispatchEvent(new Event("pause"));
      },
    });
    Object.defineProperty(HTMLMediaElement.prototype, "load", {
      configurable: true,
      value: function loadStub() {
        state.loadCalls += 1;
      },
    });
  });

  await page.context().route("https://audio.test/**", (route) =>
    route.abort("blockedbyclient"),
  );
  await page.context().route("https://*.convex.cloud/**", (route) =>
    route.abort("blockedbyclient"),
  );
  for (const service of [
    "https://*.convex.site/**",
    "https://xeno-canto.org/**",
    "https://api.ebird.org/**",
    "https://query.wikidata.org/**",
  ]) {
    await page.context().route(service, (route) =>
      route.abort("blockedbyclient"),
    );
  }
  await page.context().route("https://wikipedia.test/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<!doctype html><title>Stub Wikipedia</title>",
    }),
  );
  await page.context().route("https://ebird.test/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<!doctype html><title>Stub eBird</title>",
    }),
  );

  await page.goto("/en/atlas/test-fixture?season=all");
  await expect(
    page.getByRole("heading", { name: "Atlas browser fixture" }),
  ).toBeVisible();
});

test("plays, pauses, resumes, completes, and keeps playback exclusive", async ({
  page,
}) => {
  const winter = card(page, "Winter Demo Bird");
  const summer = card(page, "Summer Demo Bird");
  const winterButton = winter.locator("button").first();
  const summerButton = summer.locator("button").first();

  await expect(page.locator("audio")).toHaveCount(3);
  await expect(winter.locator("audio")).toHaveAttribute("preload", "none");
  await expect(winter.locator("audio")).not.toHaveAttribute("src");
  expect(
    await getAudioTestState(page),
  ).toMatchObject({ playCalls: 0 });

  await winterButton.click();
  await expect(winterButton).toHaveAccessibleName("Pause audio");

  await winterButton.click();
  await expect(winterButton).toHaveAccessibleName("Play audio");

  await winterButton.click();
  await expect(winterButton).toHaveAccessibleName("Pause audio");

  await summerButton.click();
  await expect(winterButton).toHaveAccessibleName("Play audio");
  await expect(winter.locator("audio")).not.toHaveAttribute("src");
  await expect(summerButton).toHaveAccessibleName("Pause audio");

  await summer.locator("audio").dispatchEvent("ended");
  await expect(summerButton).toHaveAccessibleName("Play audio");
  await expect(summer.locator("audio")).not.toHaveAttribute("src");

  expect(
    await getAudioTestState(page),
  ).toMatchObject({ playCalls: 3 });
});

test("recovers from failure, exposes unavailable state, supports keyboard use, and stubs references", async ({
  page,
}) => {
  const winter = card(page, "Winter Demo Bird");
  const unavailable = card(page, "Unavailable Demo Bird");
  const winterButton = winter.getByRole("button", { name: "Play audio" });

  await winterButton.focus();
  await expect(winterButton).toBeFocused();
  await page.evaluate(() => {
    (
      window as typeof window & { __atlasAudioTest: AudioTestState }
    ).__atlasAudioTest.failNextPlay = true;
  });
  await winterButton.press("Enter");
  await expect(winter.getByRole("button", { name: "Retry audio" })).toBeVisible();

  await winter.getByRole("button", { name: "Retry audio" }).click();
  await expect(winter.getByRole("button", { name: "Pause audio" })).toBeVisible();

  const unavailableButton = unavailable.getByRole("button", {
    name: "Audio unavailable",
  });
  await expect(unavailableButton).toBeDisabled();
  await expect(unavailable.locator("audio")).not.toHaveAttribute("src");

  const wikipedia = winter.getByRole("link", { name: /Wikipedia/ });
  const ebird = winter.getByRole("link", { name: /eBird/ });
  await expect(wikipedia).toHaveAttribute(
    "href",
    "https://wikipedia.test/wiki/Winter_Demo_Bird",
  );
  await expect(ebird).toHaveAttribute(
    "href",
    "https://ebird.test/species/windem1",
  );
  for (const link of [wikipedia, ebird]) {
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    await expect(link).toHaveAccessibleName(/opens in a new tab/);
  }

  const wikipediaPopup = page.waitForEvent("popup");
  await wikipedia.click();
  const popup = await wikipediaPopup;
  await expect(popup).toHaveURL("https://wikipedia.test/wiki/Winter_Demo_Bird");
  await popup.close();

  const ebirdPopup = page.waitForEvent("popup");
  await ebird.click();
  const ebirdPage = await ebirdPopup;
  await expect(ebirdPage).toHaveURL("https://ebird.test/species/windem1");
  await ebirdPage.close();
});

test("filters by Season and resets audio when a card leaves the list", async ({
  page,
}) => {
  const winter = card(page, "Winter Demo Bird");
  await winter.getByRole("button", { name: "Play audio" }).click();
  await expect(winter.getByRole("button", { name: "Pause audio" })).toBeVisible();

  await page.getByRole("button", { name: "Summer" }).click();
  await expect(page).toHaveURL(/season=summer/);
  await expect(card(page, "Winter Demo Bird")).toHaveCount(0);
  await expect(card(page, "Unavailable Demo Bird")).toHaveCount(0);
  await expect(card(page, "Summer Demo Bird")).toBeVisible();

  await page.getByRole("button", { name: "All year" }).click();
  await expect(page).toHaveURL(/season=all/);
  const restoredWinter = card(page, "Winter Demo Bird");
  await expect(
    restoredWinter.getByRole("button", { name: "Play audio" }),
  ).toBeVisible();
  await expect(restoredWinter.locator("audio")).not.toHaveAttribute("src");
});
