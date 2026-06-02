/**
 * netkeiba (race.netkeiba.com) スクレイピング
 *
 * - netkeibaはEUC-JPエンコーディングのため iconv-lite でデコードする
 * - レース一覧: race_list_sub.html?kaisai_date=YYYYMMDD
 * - 出馬表: race/shutuba.html?race_id=XXXXXXXXXXXX
 * - PC版（race.netkeiba.com）の方が枠番・馬番・馬体重まで揃うため
 *   デスクトップUAでアクセスする
 */

import axios from "axios";
import * as cheerio from "cheerio";
import iconv from "iconv-lite";
import type { Entry, Race, SurfaceType } from "@/types/race";
import type { RaceClass } from "@/types/race";

const DESKTOP_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function fetchPage(url: string): Promise<cheerio.CheerioAPI> {
  const res = await axios.get<ArrayBuffer>(url, {
    responseType: "arraybuffer",
    headers: { "User-Agent": DESKTOP_UA },
    timeout: 15000,
  });
  const buf = Buffer.from(res.data);
  // 先頭部分をASCIIとして読み、meta charsetでエンコーディングを判定する
  // （netkeibaはページにより UTF-8 / EUC-JP が混在する）
  const head = buf.subarray(0, 1024).toString("ascii").toLowerCase();
  const isEuc = head.includes("euc-jp");
  const html = isEuc ? iconv.decode(buf, "EUC-JP") : buf.toString("utf-8");
  return cheerio.load(html);
}

function ymd(dateIso: string): string {
  return dateIso.replace(/-/g, "");
}

function detectSurface(text: string): SurfaceType {
  if (text.includes("障")) return "障害";
  if (text.includes("ダ")) return "ダート";
  return "芝";
}

function detectClass(text: string): RaceClass {
  if (/G\s*1|ＧⅠ|GⅠ/.test(text)) return "G1";
  if (/G\s*2|ＧⅡ|GⅡ/.test(text)) return "G2";
  if (/G\s*3|ＧⅢ|GⅢ/.test(text)) return "G3";
  if (text.includes("オープン") || text.includes("(L)") || text.includes("リステッド")) return "OP";
  if (text.includes("3勝") || text.includes("１６００万") || text.includes("1600万")) return "3勝クラス";
  if (text.includes("2勝") || text.includes("１０００万") || text.includes("1000万")) return "2勝クラス";
  if (text.includes("1勝") || text.includes("５００万") || text.includes("500万")) return "1勝クラス";
  if (text.includes("未勝利")) return "未勝利";
  if (text.includes("新馬")) return "新馬";
  return "OP";
}

export async function scrapeRaceList(dateIso: string): Promise<Race[]> {
  const date = ymd(dateIso);
  const $ = await fetchPage(
    `https://race.netkeiba.com/top/race_list_sub.html?kaisai_date=${date}`
  );

  const races: Race[] = [];

  $(".RaceList_DataList").each((_, listEl) => {
    const headerTitle = $(listEl)
      .find(".RaceList_DataTitle")
      .text()
      .replace(/\s+/g, " ")
      .trim();
    // 例: "2回 東京 12日目" → "東京"
    const venueMatch = headerTitle.match(/[０-９0-9]+回\s*(\S+?)\s*[０-９0-9]+日目/);
    const venue = venueMatch ? venueMatch[1] : headerTitle;

    $(listEl)
      .find(".RaceList_DataItem")
      .each((__, itemEl) => {
        const href = $(itemEl).find("a").first().attr("href") ?? "";
        const idMatch = href.match(/race_id=(\d+)/);
        if (!idMatch) return;
        const raceId = idMatch[1];

        const raceNumText = $(itemEl).find(".Race_Num").text().trim();
        const raceNumber = parseInt(raceNumText, 10) || 0;
        const name = $(itemEl).find(".ItemTitle").first().text().trim();
        const startTime = $(itemEl)
          .find(".RaceList_Itemtime")
          .text()
          .trim();
        const longText = $(itemEl).find(".RaceList_ItemLong").text().trim();
        const distMatch = longText.match(/(\d+)\s*m/);
        const distance = distMatch ? parseInt(distMatch[1], 10) : 0;
        const numberText = $(itemEl)
          .find(".RaceList_Itemnumber")
          .text()
          .trim();
        const horseCount = parseInt(numberText, 10) || 0;

        races.push({
          id: raceId,
          name: name || `${raceNumber}R`,
          venue,
          date: dateIso,
          raceNumber,
          surface: detectSurface(longText),
          distance,
          raceClass: detectClass(name),
          horseCount,
          startTime: startTime || undefined,
        });
      });
  });

  return races;
}

export interface ShutubaResult {
  race: Race;
  entries: Entry[];
}

export async function scrapeShutuba(
  raceId: string
): Promise<ShutubaResult | null> {
  const $ = await fetchPage(
    `https://race.netkeiba.com/race/shutuba.html?race_id=${raceId}`
  );

  const name = $(".RaceName").first().text().trim();
  if (!name) return null;

  const data01 = $(".RaceData01").text().replace(/\s+/g, " ").trim();
  const data02Spans = $(".RaceData02 span")
    .map((_, el) => $(el).text().trim())
    .get();

  const distMatch = data01.match(/(\d+)\s*m/);
  const distance = distMatch ? parseInt(distMatch[1], 10) : 0;
  const startTime = (data01.match(/(\d{1,2}:\d{2})発走/) ?? [])[1];

  const venue = data02Spans[1] ?? "";
  const conditionText = data02Spans.join(" ");
  const headCountText = data02Spans.find((s) => /頭/.test(s)) ?? "";
  const headerHorseCount = parseInt(headCountText, 10) || 0;

  const dateParam = (raceId.match(/^(\d{4})/) ?? [])[1];

  const entries: Entry[] = [];

  $("tr.HorseList").each((_, row) => {
    const $row = $(row);
    const trId = $row.attr("id") ?? "";
    const fallbackNum = parseInt(trId.replace(/[^0-9]/g, ""), 10);

    const wakuText = $row.find("td.Waku span, td.Waku").first().text().trim();
    const umabanText = $row.find("td.Umaban").first().text().trim();
    const horseLink = $row.find("td.HorseInfo .HorseName a, td.HorseInfo a").first();
    const horseName = horseLink.text().trim();
    if (!horseName) return;
    const horseHref = horseLink.attr("href") ?? "";
    const horseId = (horseHref.match(/horse\/(\d+)/) ?? [])[1] ?? "";

    const barei = $row.find("td.Barei").first().text().trim();
    const sex = barei.charAt(0);
    const age = parseInt(barei.slice(1), 10) || 0;

    // 斤量: Bareiの次のTxt_Cセル
    const loadWeightText = $row.find("td.Barei").next("td").text().trim();
    const loadWeight = parseFloat(loadWeightText) || 0;

    const jockey = $row.find("td.Jockey a").first().text().trim();
    const trainerCell = $row.find("td.Trainer");
    const affiliation = trainerCell.find(".Label2").text().trim();
    const trainer = trainerCell.find("a").first().text().trim();

    const weightText = $row.find("td.Weight").first().text().trim();
    const weightMatch = weightText.match(/(\d+)\(([-+]?\d+)\)/);
    const horseWeight = weightMatch ? parseInt(weightMatch[1], 10) : undefined;
    const horseWeightDiff = weightMatch ? parseInt(weightMatch[2], 10) : undefined;

    const oddsText = $row.find('td.Popular span[id^="odds-"]').first().text().trim();
    const odds = /^\d/.test(oddsText) ? parseFloat(oddsText) : undefined;
    const ninkiText = $row.find('td.Popular_Ninki span[id^="ninki-"]').first().text().trim();
    const popularity = /^\d/.test(ninkiText) ? parseInt(ninkiText, 10) : undefined;

    const horseNumber = parseInt(umabanText, 10) || fallbackNum || 0;
    const gateNumber = parseInt(wakuText, 10) || 0;

    entries.push({
      id: `${raceId}-${horseNumber || entries.length + 1}`,
      raceId,
      horseId: horseId || `${raceId}-${entries.length}`,
      horseName,
      gateNumber,
      horseNumber,
      sex,
      age,
      jockey,
      trainer: affiliation ? `${affiliation} ${trainer}` : trainer,
      loadWeight,
      horseWeight,
      horseWeightDiff,
      odds,
      popularity,
    });
  });

  // 馬番が確定していれば馬番順、未確定ならそのまま
  if (entries.every((e) => e.horseNumber > 0)) {
    entries.sort((a, b) => a.horseNumber - b.horseNumber);
  }

  const race: Race = {
    id: raceId,
    name,
    venue,
    date: dateParam
      ? `${dateParam.slice(0, 4)}-??-??`
      : new Date().toISOString().split("T")[0],
    raceNumber: 0,
    surface: detectSurface(data01),
    distance,
    raceClass: detectClass(conditionText),
    horseCount: headerHorseCount || entries.length,
    startTime,
  };

  return { race, entries };
}
