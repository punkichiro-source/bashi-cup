// src/components/BetForm.tsx
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveMatchBet } from "@/lib/data/repository";
import { supabase } from "@/integrations/supabase/client";
import { Match, Side } from "@/types/domain";

export function BetForm({ match }: { match: Match }) {
  const [amount, setAmount] = useState("");
  const [pick, setPick] = useState<Side>("HOME");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: { userId: string; amount: number; pick: Side }) => {
      await saveMatchBet(data.userId, match, data.pick, data.amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["match", match.id] });
      alert("予想を登録しました！");
      setAmount("");
    },
    onError: (err: any) => {
      alert("登録失敗: " + (err.message || "予期せぬエラー"));
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("ログインしてください");
      return;
    }
    mutation.mutate({ userId: user.id, amount: Number(amount), pick });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Button 
          type="button" 
          variant={pick === "HOME" ? "default" : "outline"}
          onClick={() => setPick("HOME")}
        >ホーム({match.home_team})勝利</Button>
        <Button 
          type="button" 
          variant={pick === "AWAY" ? "default" : "outline"}
          onClick={() => setPick("AWAY")}
        >アウェイ({match.away_team})勝利</Button>
      </div>
      <Input
        type="number"
        placeholder="賭けるBASHI額"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />
      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? "登録中..." : "予想を確定する"}
      </Button>
    </form>
  );
}
