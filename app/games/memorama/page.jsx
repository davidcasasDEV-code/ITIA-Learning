import { Suspense } from "react";
import MemoramaClient from "./memorama-client";

export default function MemoramaPage() {
  return (
    <Suspense fallback={<main style={{ minHeight: "100vh" }} />}>
      <MemoramaClient />
    </Suspense>
  );
}
