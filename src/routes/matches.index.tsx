function getFlagEmoji(countryName: string): string {
  if (!countryName) return "🏳️";
  
  // 前後の不要なスペースを排除
  const cleanName = countryName.trim();

  // DBに入りそうな国名・表記ブレを完全網羅
  const isoCodes: Record<string, string> = {
    "日本": "JP", "JAPAN": "JP",
    "ブラジル": "BR", "BRAZIL": "BR",
    "フランス": "FR", "FRANCE": "FR",
    "アルゼンチン": "AR", "ARGENTINA": "AR",
    "ドイツ": "DE", "GERMANY": "DE",
    "スペイン": "ES", "SPAIN": "ES",
    "イタリア": "IT", "ITALY": "IT",
    "ポルトガル": "PT", "PORTUGAL": "PT",
    "オランダ": "NL", "NETHERLANDS": "NL",
    "クロアチア": "HR", "CROATIA": "HR",
    "ウルグアイ": "UY", "URUGUAY": "UY",
    "アメリカ": "US", "USA": "US",
    "韓国": "KR", "KOREA": "KR",
    "オーストラリア": "AU", "AUSTRALIA": "AU",
    "サウジアラビア": "SA",
    "モロッコ": "MA",
    "チュニジア": "TN",
    "セネガル": "SN",
    "カメルーン": "CM",
    "カナダ": "CA",
    "メキシコ": "MX",
  };

  const code = isoCodes[cleanName];
  if (!code) {
    // イギリス系の特殊なフラグ処理
    if (cleanName === "イングランド" || cleanName === "England") return "🏴󠁧󠁢󠁥󠁮󠁧󠁿";
    if (cleanName === "スコットランド" || cleanName === "Scotland") return "🏴󠁧󠁢󠁳󠁣󠁴󠁿";
    if (cleanName === "ウェールズ" || cleanName === "Wales") return "🏴󠁧󠁢󠁷󠁬󠁳󠁿";
    return "🏳️"; // それでもなければ白旗
  }

  return String.fromCodePoint(
    ...[...code.toUpperCase()].map(char => 127397 + char.charCodeAt(0))
  );
}
