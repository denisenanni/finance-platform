import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useNewsList } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Stream } from "@/types/api";
import { Loader2, Search } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

const getBestImageResolution = (
  resolutions: Array<{
    url: string;
    width: number;
    height: number;
    tag: string;
  }>
) => {
  if (typeof window === "undefined" || !resolutions?.length) return null;

  // Get device pixel ratio for retina displays
  const dpr = window.devicePixelRatio || 1;

  // Get viewport width
  const viewportWidth = window.innerWidth * dpr;

  // Sort resolutions by width
  const sorted = [...resolutions].sort((a, b) => a.width - b.width);

  // Find the smallest image that's larger than viewport width
  // This ensures good quality without loading unnecessarily large images
  const bestMatch =
    sorted.find((res) => res.width >= viewportWidth) ||
    sorted[sorted.length - 1];

  return bestMatch.url;
};

export const NewsFeedWidget = () => {
  const [searchTerm, setSearchTerm] = useState<string | undefined>(undefined);
  const [region, setRegion] = useState<string>("US");
  const {
    data: apiData,
    isLoading,
    error,
  } = useNewsList({
    region: region,
    snippetCount: "28",
    searchTerm: searchTerm,
  });

  const onChangeSearchTerm = (input: string) => {
    if (input.length < 5) return;

    setSearchTerm(input);
  };
  const onChangeRegion = (value: string) => {
    setRegion(value);
  };

  // Handle loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
      </div>
    );
  }

  // Handle error
  if (error) {
    return <div>Error: {error.message}</div>;
  }

  // Handle no data
  if (!apiData) {
    return <div>No data available</div>;
  }

  const { data } = apiData;
  const news = data.main.stream;
  return (
    <div className="flex flex-col gap-6 max-w-[50%] max-h-screen overflow-y-scroll">
      <NewsFeedSearchInput onChangeSearchTerm={onChangeSearchTerm} />
      <NewsFeedWidgetRegionSelector onChangeRegion={onChangeRegion} />
      {news.map((el) => (
        <NewsItem key={el.id} {...el} />
      ))}
    </div>
  );
};

const NewsItem = (news: Stream) => {
  const resolutions = news.content.thumbnail?.resolutions;
  // Get default resolution for width/height
  const defaultRes =
    resolutions?.find((res) => res.tag === "original") || resolutions?.[0];
  const imageUrl = news.content.thumbnail?.resolutions
    ? getBestImageResolution(news.content.thumbnail.resolutions)
    : null;

  return (
    <div className="card">
      <a
        target="_blank"
        href={news.content.providerContentUrl ?? news.content.canonicalUrl.url}
        className="flex gap-4 rounded-lg p-3  transition-colors"
        rel="noopener noreferrer"
      >
        <div className="max-w-[150px]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={news.content.title}
              width={defaultRes.width}
              height={defaultRes.height}
              className="rounded-lg mb-3"
              loading="lazy"
            />
          ) : (
            <div className="w-[150px] h-[100px] bg-muted rounded-lg flex items-center justify-center text-sm text-muted-foreground">
              No Image
            </div>
          )}
        </div>
        <div className="flex flex-col justify-between">
          <h4 className="font-medium text-base">{news.content.title}</h4>
          <span className="text-sm text-muted-foreground self-end">
            {formatDate(news.content.pubDate)}
          </span>
        </div>
      </a>
    </div>
  );
};

const NewsFeedSearchInput = ({
  onChangeSearchTerm,
}: {
  onChangeSearchTerm: (input: string) => void;
}) => {
  const [value, setValue] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      if (value.length >= 5) onChangeSearchTerm(value);
    }, 400);

    return () => clearTimeout(handler);
  }, [value, onChangeSearchTerm]);

  return (
    <Input
      id="search"
      type="text"
      placeholder="Cerca.."
      className="pl-10"
      onChange={(e) => setValue(e.target.value)}
      icon={<Search />}
    />
  );
};

const NewsFeedWidgetRegionSelector = ({
  onChangeRegion,
}: {
  onChangeRegion: (region: string) => void;
}) => {
  const options = [
    {
      label: "US",
      value: "US",
    },
    {
      label: "BR",
      value: "BR",
    },
    {
      label: "AU",
      value: "AU",
    },
    { label: "CA", value: "CA" },
    { label: "SG", value: "SG" },

    { label: "GB", value: "GB" },
    { label: "ES", value: "ES" },
    { label: "IT", value: "IT" },
    { label: "IN", value: "IN" },
    { label: "HK", value: "HK" },
    { label: "DE", value: "DE" },
    {
      label: "FR",
      value: "FR",
    },
  ];
  return (
    <Select
      options={options}
      placeholder="Search news by region"
      onChange={(e) => onChangeRegion(e.target.value)}
    />
  );
};
