import type { Metadata } from "next";
import { Metronome } from "@/components/practice/Metronome";
import { Drone } from "@/components/practice/Drone";
import { Tuner } from "@/components/practice/Tuner";
import { EarTraining } from "@/components/practice/EarTraining";
import { PageShell } from "@/components/ui/PageShell";

export const metadata: Metadata = {
  title: "練習工具 · guitar-lab",
  description: "節拍器(可設拍號、細分、重音、加速練習)、持續音 Drone、調音器與聽力測驗,輔助節奏、音準與辨音練習。",
};

export default function PracticePage() {
  return (
    <PageShell
      eyebrow="練習與製作"
      title="練習工具"
      width="reading"
      subtitle="用節拍器練穩定節奏、持續音(Drone)或調音器校準音準,再用聽力測驗訓練辨音。"
    >
      <div className="space-y-6">
        <Metronome />
        <Drone />
        <Tuner />
        <EarTraining />
      </div>
    </PageShell>
  );
}
