import { describe, expect, it } from "vitest";
import { parseHistogramTsv } from "./parse";

const SAMPLE = `
Frequency of observations in the selected location(s).:
Number of taxa:	2

	Jan				Feb				Mar				Apr				May				Jun				Jul				Aug				Sep				Oct				Nov				Dec				
Sample Size:	1.0	1.0	1.0	1.0	1.0	1.0	1.0	1.0	1.0	1.0	1.0	1.0	1.0	1.0	1.0	1.0	1.0	1.0	1.0	1.0	1.0	1.0	1.0	1.0	1.0	1.0	1.0	1.0	1.0	1.0	1.0	1.0	1.0	1.0	1.0	1.0	1.0	1.0	1.0	1.0	1.0	1.0	1.0	1.0	1.0	1.0	1.0	1.0	

Eurasian Tree Sparrow (Passer montanus)	0.8	0.5	0	0	0	0	0	0	0.1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0.2	
Barn Swallow (Hirundo rustica)	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0.5	0.6	0.4	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	
`;

describe("parseHistogramTsv", () => {
  it("parses common (scientific) rows into 48 weekly frequencies", () => {
    const rows = parseHistogramTsv(SAMPLE);
    expect(rows).toHaveLength(2);
    const sparrow = rows.find((r) => r.sciName === "Passer montanus");
    expect(sparrow).toMatchObject({
      sciName: "Passer montanus",
      comNameEn: "Eurasian Tree Sparrow",
    });
    expect(sparrow?.weeks).toHaveLength(48);
    expect(sparrow?.weeks[0]).toBe(0.8);
    expect(sparrow?.weeks[47]).toBe(0.2);
  });
});
