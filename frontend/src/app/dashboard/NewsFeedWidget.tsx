import { useNewsList } from "@/lib/api";
import { Stream } from "@/types/api";

export const NewsFeedWidget = () => {
  const {
    data: apiData,
    isLoading,
    error,
  } = useNewsList({
    region: "US",
    snippetCount: "28",
    searchTerm: "",
  });

  // Handle loading
  if (isLoading) {
    return <div>Loading news...</div>;
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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        maxWidth: "50%",
        maxHeight: "100vh",
        overflow: "scroll",
      }}
    >
      {news.map((el) => (
        <NewsItem key={el.id} {...el} />
      ))}
    </div>
  );
};

const NewsItem = (news: Stream) => {
  return <div className="card">{news.content.title}</div>;
};
