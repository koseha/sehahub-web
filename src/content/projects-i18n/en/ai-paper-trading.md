---
title: "AI Paper Trading"
summary: "A record of an experiment in which three AIs, given the same data and the same instructions, each manage a virtual fund. Two tracks, Korea and the US, plus day-trading bots you can watch, with trading costs built in."
period: "Jul 2026 – present"
team: "Solo project"
demos:
- "Korea track demo"
- "US track demo"
- "Day-trading bot demo"
captions:
- "Korea track — cumulative performance by account (at each round's closing prices)"
- "Round log — the reasoning each AI recorded"
- "US track — eight large-cap stocks and the benchmark account"
- "Day-trading bots — today's results for all four bots"
---

This experiment hands AIs industry-cycle indicators and stock prices, lets them manage virtual money, and watches what happens. **The accounts are virtual, and no real trades are made.** Nothing here recommends any stock.

The three accounts get exactly the same data and the same instructions. That way, differences between them can be read as differences in judgment, not in character. In the first round, each account sets its own investment principles. In later rounds, it keeps them or changes them. A benchmark account buys equal weights in the first round and then does nothing. Without it, the returns would be impossible to interpret. Alongside them, one more account runs on a separate track and makes its calls with no limits on its inputs. It can see the news, company filings, and even the other accounts' decisions. Its conditions differ from those of the three AIs, so it isn't shown in the same table.

## Two tracks

The Korea track looks at industry-cycle indicators and stock prices. For the US track, a collector in a separate repository gathers whatever free sources it can reach — filings, earnings, options, short interest, sentiment and more — and passes all of it along untouched, with no rules for judging it. There are no rules set in advance because the more dimensions you add, the more certain it is that some condition will line up by pure chance.

The two tracks differ in currency, in what they trade, in when they started, and in what the AI sees. Their results can't be compared side by side.

## Day-trading bots

They live on the same page as the experiment, but they're separate bots. They read one-minute candles, trade during market hours, and close out every position before the market closes. Fees are charged on every trade, along with the transaction tax on sales — no shortcuts. A round trip costs about 0.23%, so five trades a day cost more than 1% a day on their own. Run them with zero friction and they show a profit almost every time, which makes them pointless to watch.

Each bot is a bundle of stock-selection criteria and trading rules. Three of them — liquidity, volatility, and gap — run mechanically. On top of those, I added a bot whose stocks an AI picks itself, after going through even the previous evening's news. Its trading rules are exactly the same as the liquidity bot's. So any gap in results between the two comes from stock selection alone.

The bots run under the same rules in Korea and the US. In Korea a transaction tax applies when you sell; in the US it doesn't. How the same strategy plays out in each market becomes a direct comparison. A season lasts eight weeks, and a bot that loses half its starting capital is done for that season. Korea has been paused since October 21, 2026, and only the US is running now.

## What I paid attention to

**Don't contaminate the decision sessions.** The side that makes decisions can reach only two things: the instructions and the input files. It isn't told what the other accounts bought, or even that changes in its own principles are being observed. If it knew, it would hold itself to consistency artificially.

**Add providers without touching the consumer.** The industries under observation are managed in a separate repository. The goal was that adding an industry there would need no code changes here. I only got there once even the stock names came from the data. Before that, I once marked the goal as not met because one line of name mapping was still left in the UI.

**Don't trust the checkers.** I built ten kinds of gates that check the rendered output, then fed them deliberately broken code to see whether each gate really catches it. That's how I found that the check meant to stop buys and sells from using directional colors was missing pastel colors entirely. Building a checker and having it actually catch things are not the same.

**Keep the page complete even when the feed drops.** First, the server builds a finished HTML page from the round's closing prices. During market hours, the page fetches JSON from the same server every 30 seconds and draws the live quotes on top. The quotes come from an always-on machine at home, so the feed can cut out at any moment. If it does, the page still holds up as of the last round, and it shows the as-of time so you can tell it has stopped.

## Architecture

<div class="not-prose flow-box">
  <div class="flex flex-col gap-6">
    <div>
      <div class="flow-label">Record layer (each round)</div>
      <div class="flow-row">
        <span class="flow-node">Round log JSON</span>
        <span class="flow-arrow" aria-hidden="true">&rarr;</span>
        <span class="flow-node">site.py</span>
        <span class="flow-arrow" aria-hidden="true">&rarr;</span>
        <span class="flow-node">GitHub Actions</span>
        <span class="flow-arrow" aria-hidden="true">&rarr;</span>
        <span class="flow-node">Cloudflare Pages</span>
        <span class="flow-arrow" aria-hidden="true">&rarr;</span>
        <span class="flow-node flow-node-end">One finished HTML page</span>
      </div>
    </div>
    <div>
      <div class="flow-label">Display layer (every 30 s during market hours)</div>
      <div class="flow-row">
        <span class="flow-node">Quote API</span>
        <span class="flow-arrow" aria-hidden="true">&rarr;</span>
        <span class="flow-node">Mac mini poller</span>
        <span class="flow-arrow" aria-hidden="true">&rarr;</span>
        <span class="flow-node">Cloudflare KV</span>
        <span class="flow-arrow" aria-hidden="true">&rarr;</span>
        <span class="flow-node">Worker /live.json</span>
        <span class="flow-arrow" aria-hidden="true">&rarr;</span>
        <span class="flow-node flow-node-end">Browser overlays only the numbers</span>
      </div>
    </div>
    <div class="flow-note">If the display layer goes down, the page the record layer drew stays as it is. Only the as-of time goes stale.</div>
  </div>
</div>

The single HTML page is built with nothing but the Python standard library — no dependencies. Even the charts are generated directly as SVG. Rendering happens on GitHub Actions, and the page deploys to Cloudflare Pages.

Only intraday quotes take a different route. The quote API checks the caller's IP, so a CI runner can't call it. Instead, a Mac mini at home fetches quotes every 30 seconds and puts them in Cloudflare KV, and a Worker serves them from the same domain. Before every deploy, an automated check confirms there are zero third-party requests.
