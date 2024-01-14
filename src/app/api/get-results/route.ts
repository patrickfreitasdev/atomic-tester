import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: NextRequest ) {

  const searchParams = new URL(request.url).searchParams;
  
  const url = searchParams.get("site");
  const device = searchParams.get("device");
  
  const api = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

  const response = await axios.get(api, {
    params: {
      url,
      strategy: device,
      returnfields: "lighthouseResult/categories/performance/score", // Specify score extraction
      category: "performance",
      //key: process.env.API_KEY,
    },
  });

  const data = await response.data.lighthouseResult.categories.performance
    .score;

  if (data) {
    return NextResponse.json({ score: data * 100 });
  }

  return NextResponse.json({ error: true }, { status: 500 });
}
