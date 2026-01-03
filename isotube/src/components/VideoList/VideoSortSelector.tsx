export function VideoSortSelector(props: {
  value: "added" | "title" | "rating" | "status" | "uploaded",
  onChange: (e: any) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-400 shrink-0">Sort:</span>
      <div className="relative flex-1">
        <select
          value={props.value}
          onChange={props.onChange}
          className="appearance-none w-full bg-gray-700 text-sm rounded pl-2 pr-7 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="added">Recently Added</option>
          <option value="uploaded">Upload Date</option>
          <option value="title">Title</option>
          <option value="rating">Rating</option>
          <option value="status">Status</option>
        </select>
        <svg
          className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}