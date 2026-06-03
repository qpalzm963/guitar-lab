import type { Metadata } from "next";
import { Metronome } from "@/components/practice/Metronome";
import { Drone } from "@/components/practice/Drone";

export const metadata: Metadata = {
  title: "練習工具 · guitar-lab",
  description: "節拍器(可設拍號、細分、重音、加速練習)與持續音 Drone,輔助節奏與音準練習。",
};

export default function PracticePage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-1 text-2xl font-bold">練習工具</h1>
      <p className="mb-6 text-sm text-gray-500">
        用節拍器練習穩定的節奏,或開啟持續音(Drone)練習音準。調音器、聽力測驗等功能為規劃中。
      </p>
      <div className="space-y-6">
        <Metronome />
        <Drone />
      </div>
    </main>
  );
}
