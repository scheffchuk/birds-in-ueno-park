import { expect, test } from "@playwright/test";

test("audio credits have a localized route and locale toggle", async ({
  page,
}) => {
  await page.goto("/en/audio");

  await expect(page).toHaveURL(/\/en\/audio$/);
  await expect(
    page.getByRole("heading", { name: "Audio credits", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "About" }),
  ).toHaveAttribute("href", "/en/about");

  // LocaleSwitcher ignores clicks during the first 400ms of hydration.
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Language" }).click();
  await page.getByRole("menuitemradio", { name: "日本語" }).click();

  await expect(page).toHaveURL(/\/ja\/audio$/);
  await expect(
    page.getByRole("heading", { name: "音声クレジット", level: 1 }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "言語" })).toBeVisible();
});
