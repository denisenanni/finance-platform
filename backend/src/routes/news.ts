// backend/src/routes/news.ts
import express, { Request, Response } from "express";
import { optionalAuth } from "../middleware/auth";
import {
  NewsDetailsRequest,
  NewsDetailsResponse,
  NewsListRequest,
  NewsListResponse,
} from "@/types/news";

const router = express.Router();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "";
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || "";

router.post(
  "/list",
  optionalAuth,
  async (
    req: Request<{}, {}, NewsListRequest>,
    res: Response
  ): Promise<void> => {
    try {
      const { region = "US", snippetCount = "28", uuids = "" } = req.body;

      if (!RAPIDAPI_KEY) {
        console.warn("⚠️  RAPIDAPI_KEY not set, returning mock data");
        const mockResponse: NewsListResponse = {
          data: {
            main: {
              stream: [
                {
                  id: "mock-1",
                  content: {
                    id: "mock-1",
                    contentType: "STORY",
                    title: "Markets Rally on Strong Earnings Reports",
                    pubDate: new Date().toISOString(),
                    thumbnail: {
                      resolutions: [
                        {
                          url: "https://via.placeholder.com/640x360",
                          width: 640,
                          height: 360,
                          tag: "original",
                        },
                      ],
                    },
                    provider: {
                      displayName: "Financial Times",
                    },
                  },
                },
              ],
              nextPage: false,
            },
          },
          status: "OK",
        };
        res.json(mockResponse);
        return;
      }

      const url = `https://${RAPIDAPI_HOST}/news/v2/list`;

      const response = await fetch(
        `${url}?region=${region}&snippetCount=${snippetCount}`,
        {
          method: "POST",
          headers: {
            "x-rapidapi-key": RAPIDAPI_KEY,
            "x-rapidapi-host": RAPIDAPI_HOST,
            "Content-Type": "text/plain",
          },
          body: uuids,
        }
      );

      if (!response.ok) {
        throw new Error(`Yahoo Finance API returned ${response.status}`);
      }

      const data = (await response.json()) as NewsListResponse;
      res.json(data);
    } catch (error) {
      console.error("News list fetch error:", error);
      res.status(500).json({
        error: "Failed to fetch news list",
        code: "NEWS_LIST_FETCH_ERROR",
      });
    }
  }
);

router.get(
  "/details",
  optionalAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { uuid, region = "US" } = req.query;

      if (!uuid || typeof uuid !== "string") {
        res.status(400).json({
          error: "UUID is required",
          code: "MISSING_UUID",
        });
        return;
      }

      if (!RAPIDAPI_KEY) {
        res.json({
          data: {},
          message: "RAPIDAPI_KEY not configured",
        });
        return;
      }

      const url = new URL(`https://${RAPIDAPI_HOST}/news/v2/get-details`);
      url.searchParams.append("uuid", uuid);
      url.searchParams.append("region", region as string);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": RAPIDAPI_HOST,
        },
      });

      if (!response.ok) {
        throw new Error(`Yahoo Finance API returned ${response.status}`);
      }

      const data = (await response.json()) as NewsListResponse;

      res.json(data);
    } catch (error) {
      console.error("News details fetch error:", error);
      res.status(500).json({
        error: "Failed to fetch news details",
        code: "NEWS_DETAILS_FETCH_ERROR",
      });
    }
  }
);

export default router;
