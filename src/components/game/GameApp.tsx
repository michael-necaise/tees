import { useEffect, useState, type ReactNode } from "react";
import { Volume2, VolumeX, Check } from "lucide-react";
import { playBuy, playCarve, playFlag, resumeAudio, unlockAudio } from "@/game/audio";
import {
  EARTH,
  focusProject,
  formatCompact,
  formatDuration,
  formatMoney,
  formatTees,
  fightOdds,
  earthFocus,
  latheEach,
  megaEach,
  nextTrait,
  priceNudge,
  pricePreview,
  projectImpact,
  spaceFlow,
  SWARM,
  TRAITS,
  traitImpact,
  viewOf,
  wantLathe,
  wantMega,
  type EarthBuy,
  type Trait,
} from "@/game/sim";
import { useGame } from "@/game/store";
import { Btn, cn } from "@/components/game/ui";

export function GameApp() {
  const phase = useGame((s) => s.phase);

  useEffect(() => {
    useGame.getState().hydrate();
  }, []);

  useEffect(() => {
    let raf = 0;
    let acc = 0;
    let saveAcc = 0;
    let last = performance.now();
    const onHide = () => {
      if (document.hidden) useGame.getState().persist();
    };
    const onShow = () => {
      if (document.hidden) return;
      resumeAudio();
      useGame.getState().catchUp();
      last = performance.now();
      acc = 0;
    };
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (document.hidden) {
        last = now;
        return;
      }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const state = useGame.getState();
      if (!state.hydrated) return;
      acc += dt;
      let steps = 0;
      while (acc >= 0.1 && steps < 4) {
        useGame.getState().tick(0.1);
        acc -= 0.1;
        steps += 1;
      }
      if (steps === 4) acc = 0;
      saveAcc += dt;
      if (saveAcc >= 2) {
        saveAcc = 0;
        useGame.getState().persist();
      }
    };
    const onVis = () => {
      if (document.hidden) onHide();
      else onShow();
    };
    raf = requestAnimationFrame(frame);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", onHide);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", onHide);
    };
  }, []);

  if (phase === "epilogue") return <Epilogue />;
  if (phase === "proposal") return <Proposal />;
  if (phase === "space") return <Stars />;
  if (phase === "earth") return <Planet />;
  return <Workshop />;
}

function SoundButton() {
  const sound = useGame((s) => s.sound);
  return (
    <button
      type="button"
      aria-label={sound ? "Mute" : "Sound on"}
      className="flex size-11 shrink-0 items-center justify-center rounded-xl text-ink"
      onClick={() => {
        const next = !useGame.getState().sound;
        if (next) unlockAudio();
        useGame.getState().toggleSound();
      }}
    >
      {sound ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
    </button>
  );
}

function Shell({
  stage,
  title,
  children,
}: {
  stage: string;
  title: string;
  children: ReactNode;
}) {
  const s = useGame();
  return (
    <main className="mx-auto min-h-dvh w-full max-w-md px-4 py-4">
      <section className="rounded-2xl border-l-4 border-flag bg-cream px-4 py-4 text-ink">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-4xl leading-none italic">Tees</h1>
            <p className="mt-1 text-xs font-semibold tracking-widest text-ink/70 uppercase">{stage}</p>
            {s.seasons > 0 && <p className="mt-0.5 text-xs text-ink/50">Season {s.seasons + 1}</p>}
          </div>
          <SoundButton />
        </header>
        <h2 className="mt-4 font-display text-3xl leading-tight">{title}</h2>
        {s.offline && (
          <div className="mt-3 rounded-xl bg-ink/5 px-3 py-2 text-sm leading-snug">
            <p>
              Away {formatDuration(s.offline.seconds)}. The shop made {formatTees(s.offline.tees)}
              {Math.abs(s.offline.cash) >= 0.5 ? ` and the till moved ${formatMoney(s.offline.cash)}` : ""}.
            </p>
            <button
              type="button"
              className="mt-1 font-semibold underline decoration-ink/30 underline-offset-2"
              onClick={() => useGame.getState().dismissOffline()}
            >
              Dismiss
            </button>
          </div>
        )}
        {s.flash && <p className="mt-3 text-sm leading-snug text-ink/80">{s.flash}</p>}
        {children}
        <Reset />
      </section>
    </main>
  );
}

function perSec(n: number) {
  return `${formatCompact(n)} a second`;
}

function Move({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 rounded-xl border border-gold bg-gold/20 px-3 py-2 text-sm leading-snug font-medium">{children}</p>
  );
}

function FirstSteps() {
  const s = useGame();
  const made = s.tees >= 1;
  const sold = s.cash > 0.05 || s.tees > s.unsold + 0.4;
  const spent = s.lathes > 0 || s.wood > 100;
  if (made && sold && spent) return null;
  if (s.tees >= 18 || s.lathes > 0) return null;
  return (
    <ol className="mt-3 space-y-1.5 text-sm leading-snug">
      <Step n={1} done={made} text="Make a tee. It lands on the counter." />
      <Step n={2} done={sold} text="Wait a moment. A golfer buys it, and cash appears." />
      <Step n={3} done={spent} text="Spend the cash on wood, or on a lathe that cuts for you." />
    </ol>
  );
}

function Step({ n, done, text }: { n: number; done: boolean; text: string }) {
  return (
    <li className={cn("flex gap-2", done && "text-ink/40")}>
      <span
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
          done ? "bg-ink/10" : "bg-gold",
        )}
      >
        {done ? <Check className="size-3" strokeWidth={3} /> : n}
      </span>
      <span className={done ? "line-through" : undefined}>{text}</span>
    </li>
  );
}

function Section({ k, hint, children }: { k: string; hint: string; children: ReactNode }) {
  return (
    <div className="mt-4 space-y-2">
      <div>
        <p className="text-xs font-semibold tracking-widest text-ink/50 uppercase">{k}</p>
        <p className="text-xs leading-snug text-ink/70">{hint}</p>
      </div>
      {children}
    </div>
  );
}

function Workshop() {
  const s = useGame();
  const v = viewOf(s);
  const [pops, setPops] = useState<{ id: number; n: number }[]>([]);
  const out = s.wood + 1e-9 < v.woodEach;
  const nudge = priceNudge(s);
  const nextProject = focusProject(s);
  const woodHot = out && s.cash + 1e-6 >= v.dowelCost;
  const latheHot = !nextProject && wantLathe(s);
  const megaHot = !nextProject && !latheHot && wantMega(s);
  const carveHot = !out && nudge === 0 && !woodHot && !nextProject && !latheHot && !megaHot;

  function carveTee() {
    unlockAudio();
    const made = useGame.getState().carve();
    if (made <= 0) return;
    playCarve(useGame.getState().sound);
    const id = Date.now() + Math.random();
    setPops((prev) => [...prev.slice(-4), { id, n: made }]);
  }

  function buy(run: () => boolean) {
    unlockAudio();
    if (run()) playBuy(useGame.getState().sound);
  }

  const lower = pricePreview(s, -1);
  const higher = pricePreview(s, 1);
  const latheNext = latheEach(s);
  const megaNext = megaEach(s);
  const woodUnit = (v.quote / v.dowelWood) * v.woodEach;
  const supply = Math.max(v.make, s.unsold > 0 ? v.demand : 0);
  const income = Math.min(v.demand, supply) * v.price;
  const tapsLeft = s.wood / Math.max(0.01, v.woodEach);
  const woodHint =
    s.wood + 1e-9 < v.woodEach
      ? "Out. Buy a dowel."
      : v.make > 0.05
        ? `Lasts about ${formatDuration(s.wood / (v.make * v.woodEach))}`
        : `About ${formatTees(tapsLeft)} taps left`;
  const early = s.lathes === 0 && s.tees < 18 && s.wood <= 100;
  const dowelDetail =
    v.make < 0.05
      ? `Adds ${formatTees(v.dowelWood)} wood. Each tee uses ${formatTees(v.woodEach)}, so that is ${formatTees(v.dowelWood / v.woodEach)} taps.`
      : `Adds ${formatTees(v.dowelWood)} wood. The machines burn through it in about ${formatDuration(v.dowelWood / (v.make * v.woodEach))}.`;

  return (
    <Shell stage="Stage 1 · The workshop" title="Make tees">
      {early ? <FirstSteps /> : <Move>{v.coach}</Move>}
      <p className="mt-4 font-display text-6xl leading-none tabular-nums">{formatTees(s.tees)}</p>
      <p className="mt-1 text-sm text-ink/70">tees made, ever</p>

      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 border-t border-ink/10 pt-3">
        <Stat
          k="On the counter"
          v={formatTees(s.unsold)}
          hint={s.unsold > 0 ? "Golfers buy these." : "Empty until you make one."}
        />
        <Stat k="Golfers want" v={`${formatCompact(v.demand)} a second`} hint={`At ${formatMoney(v.price)} a tee`} />
        <Stat
          k="Cash"
          v={formatMoney(s.cash)}
          hint={income > 0.005 ? `About ${formatMoney(income)} a second` : "Appears when a tee sells"}
        />
        <Stat k="Wood" v={formatTees(s.wood)} hint={woodHint} />
      </dl>
      {v.make > 0.05 && (
        <p className="mt-2 text-sm leading-snug">
          {v.make + 0.05 < v.demand
            ? `Machines cut ${perSec(v.make)}. Golfers want ${perSec(v.demand)}. You are behind — raise the price or cut faster.`
            : v.make > v.demand * 1.15
              ? `Machines cut ${perSec(v.make)}, but golfers only want ${perSec(v.demand)}. Lower the price or they will stack up.`
              : `Machines cut ${perSec(v.make)}, close to what golfers want.`}
        </p>
      )}

      <div className="relative mt-4">
        <Btn tone={carveHot ? "gold" : "ink"} className="h-auto w-full flex-col gap-0 py-3 text-base" onClick={carveTee} disabled={out}>
          <span>{out ? "Out of wood" : "Make tee"}</span>
          <span className="text-xs font-medium opacity-80">
            {out
              ? "Buy a dowel below, or sweep the floor."
              : `Puts ${formatTees(v.click)} on the counter. Golfers buy it for ${formatMoney(v.price)}.`}
          </span>
        </Btn>
        <div className="pointer-events-none absolute inset-x-0 -top-1 flex justify-center">
          {pops.map((pop) => (
            <span
              key={pop.id}
              className="pop-float absolute text-sm font-semibold text-ink"
              onAnimationEnd={() => setPops((prev) => prev.filter((p) => p.id !== pop.id))}
            >
              +{formatTees(pop.n)}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold tracking-widest text-ink/50 uppercase">Price</p>
        <p className="mt-1 text-sm leading-snug">
          You charge <span className="font-semibold">{formatMoney(v.price)}</span> a tee. Cheaper brings more golfers.
          Dearer pays more per tee. The wood in one tee costs about {formatMoney(woodUnit)} — stay above that.
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Btn
            tone={nudge === -1 ? "gold" : "ink"}
            className="h-auto flex-col gap-0 px-2 py-2"
            aria-label="Lower price"
            disabled={!lower}
            onClick={() => useGame.getState().nudgePrice(-1)}
          >
            <span>{lower ? `Lower to ${formatMoney(lower.price)}` : "Lowest price"}</span>
            <span className="text-xs font-medium opacity-80">
              {lower ? `They buy ${perSec(lower.demand)}` : "Can't go lower"}
            </span>
          </Btn>
          <Btn
            tone={nudge === 1 ? "gold" : "ink"}
            className="h-auto flex-col gap-0 px-2 py-2"
            aria-label="Raise price"
            disabled={!higher}
            onClick={() => useGame.getState().nudgePrice(1)}
          >
            <span>{higher ? `Raise to ${formatMoney(higher.price)}` : "Highest price"}</span>
            <span className="text-xs font-medium opacity-80">
              {higher ? `They buy ${perSec(higher.demand)}` : "Can't go higher"}
            </span>
          </Btn>
        </div>
      </div>

      <Section k="Wood" hint="Every tee spends wood. At zero, cutting stops.">
        <Buy
          title="Dowel bundle"
          detail={dowelDetail}
          cost={formatMoney(v.dowelCost)}
          hot={woodHot}
          disabled={s.cash + 1e-6 < v.dowelCost}
          onClick={() => buy(() => useGame.getState().buyDowel())}
        />
        {v.showLumber && (
          <Buy
            title="Lumber load"
            detail={`Adds ${formatTees(v.lumberWood)} wood in one buy. More wood per dollar than a dowel.`}
            cost={formatMoney(v.lumberCost)}
            hot={false}
            disabled={s.cash + 1e-6 < v.lumberCost}
            onClick={() => buy(() => useGame.getState().buyLumber())}
          />
        )}
      </Section>

      <Section k="Machines" hint="They cut while you watch the price. You can stop tapping.">
        <Buy
          title="Auto-lathe"
          detail={
            s.lathes > 0
              ? `You have ${s.lathes}, cutting ${perSec(v.make)}. The next one makes it ${perSec(v.make + latheNext)}.`
              : `Cuts ${perSec(latheNext)} by itself. You go from tapping to ${perSec(latheNext)}.`
          }
          cost={formatMoney(v.latheCost)}
          hot={latheHot}
          disabled={s.cash + 1e-6 < v.latheCost}
          onClick={() => buy(() => useGame.getState().buyLathe())}
        />
        {v.showMega && (
          <Buy
            title="Mega-lathe"
            detail={`${s.megas} running, cutting ${perSec(v.make)}. The next one makes it ${perSec(v.make + megaNext)}. They eat wood fast.`}
            cost={formatMoney(v.megaCost)}
            hot={megaHot}
            disabled={s.cash + 1e-6 < v.megaCost}
            onClick={() => buy(() => useGame.getState().buyMega())}
          />
        )}
      </Section>

      {(v.trust > 0 || s.processors > 0) && (
        <Section
          k="Trust"
          hint={
            v.trustLeft > 0
              ? `${v.trustLeft} to spend. A processor thinks up projects. Memory lets bigger ones fire.`
              : "Spent for now. More trust shows up as the tee count climbs."
          }
        >
          <Buy
            title="Processor"
            detail={
              s.processors > 0
                ? `${s.processors} thinking. A full bar makes ${formatCompact(s.processors * 0.11)} creativity a second. Projects spend that.`
                : "Fills a thinking bar. When the bar is full, it becomes creativity, which pays for projects."
            }
            cost="1 trust"
            hot={v.trustLeft > 0 && s.processors < 1}
            disabled={v.trustLeft < 1}
            onClick={() => buy(() => useGame.getState().buyProcessor())}
          />
          <Buy
            title="Memory"
            detail={`The bar holds ${formatCompact(v.opsMax)} now, ${formatCompact(100 + (s.memory + 1) * 160)} after. Some projects need the bar nearly full.`}
            cost="1 trust"
            hot={false}
            disabled={v.trustLeft < 1}
            onClick={() => buy(() => useGame.getState().buyMemory())}
          />
          {s.processors > 0 && (
            <div className="rounded-xl border border-ink/10 px-3 py-2 text-sm">
              <div className="flex justify-between gap-2">
                <span>Thinking</span>
                <span className="tabular-nums">
                  {formatCompact(s.ops)} / {formatCompact(v.opsMax)}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10">
                <div
                  className="h-full rounded-full bg-gold"
                  style={{ width: `${Math.min(100, (s.ops / Math.max(1, v.opsMax)) * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-xs leading-snug text-ink/60">
                Creativity {formatCompact(s.creativity)}. A full bar adds more. Projects spend it.
              </p>
            </div>
          )}
        </Section>
      )}

      {s.owned.includes("skins") && (
        <div className="mt-4">
          <p className="text-xs font-semibold tracking-widest text-ink/50 uppercase">A side bet</p>
          <p className="text-xs leading-snug text-ink/70">Yomi is nerve. Win 3, or 1 if the hole is halved. Some projects cost yomi.</p>
          <Btn
            tone="ink"
            className="mt-2 h-12 w-full"
            disabled={s.clock < s.skinAt}
            onClick={() => {
              unlockAudio();
              useGame.getState().playSkin();
              playBuy(useGame.getState().sound);
            }}
          >
            {s.clock < s.skinAt ? "Cooling down" : "Play a skin"}
          </Btn>
          <p className="mt-2 text-xs text-ink/60">Yomi on hand: {s.yomi}</p>
        </div>
      )}

      {v.offers.length > 0 && (
        <Section k="Projects" hint="Buy once. The sentence is the exact change.">
          {v.offers.map((offer) => (
            <Buy
              key={offer.def.id}
              title={offer.def.name}
              detail={projectImpact(s, offer.def.id)}
              cost={offer.cost}
              hot={nextProject === offer.def.id}
              disabled={!offer.afford}
              onClick={() => {
                unlockAudio();
                const before = useGame.getState().phase;
                const ok = useGame.getState().buyProject(offer.def.id);
                if (!ok) return;
                if (useGame.getState().phase !== before) playFlag(useGame.getState().sound);
                else playBuy(useGame.getState().sound);
              }}
            />
          ))}
        </Section>
      )}

      {out && s.cash + 1e-6 < v.dowelCost && (
        <div className="mt-3">
          <Btn tone="gold" className="h-auto w-full flex-col gap-0 py-3" onClick={() => useGame.getState().sweep()}>
            <span>Sweep the floor</span>
            <span className="text-xs font-medium opacity-80">A free dowel. {formatTees(v.dowelWood)} wood.</span>
          </Btn>
        </div>
      )}
    </Shell>
  );
}

function Planet() {
  const s = useGame();
  const v = viewOf(s);
  const ready = s.matter <= 0;
  const syncReady = s.clock >= s.syncAt;
  const funReady = s.clock >= s.entertainAt && s.pile >= SWARM.partyCost;

  const focus = earthFocus(s);
  const fell = s.harvesters * EARTH.harvest * v.swarm;
  const milled = s.woodDrones * EARTH.mill * v.swarm;
  const stamped = s.factories * EARTH.stamp * EARTH.teesPerWood * v.swarm;

  function buy(kind: EarthBuy) {
    unlockAudio();
    if (useGame.getState().buyEarth(kind)) playBuy(useGame.getState().sound);
  }

  return (
    <Shell stage="Stage 2 · The planet" title={ready ? "The forests are gone" : "Convert the Earth"}>
      <Move>{ready ? "Nothing left to cut. Launch, and the caddies take the idea to the stars." : v.coach}</Move>
      <p className="mt-3 text-sm leading-snug text-ink/80">
        Harvesters knock forests into boards. Wood drones mill the boards. Factories stamp that wood into tees you spend
        on more drones.
      </p>
      <p className="mt-4 font-display text-6xl leading-none tabular-nums">{formatTees(s.matter)}</p>
      <p className="mt-1 text-sm text-ink/70">forests left</p>

      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 border-t border-ink/10 pt-3">
        <Stat k="Boards in the yard" v={formatTees(s.timber)} hint={`${formatCompact(fell)} a second, knocked down`} />
        <Stat k="Wood ready" v={formatTees(s.wood)} hint={`${formatCompact(milled)} a second, milled`} />
        <Stat k="Tee pile" v={formatTees(s.pile)} hint={`${formatCompact(stamped)} a second, added`} />
        <Stat k="Power stored" v={`${formatCompact(s.powerStored)} / ${formatCompact(v.powerCap)}`} hint="Drones stop when this hits 0" />
      </dl>
      <p className="mt-3 text-sm leading-snug">
        The sun makes {formatCompact(v.powerProd)} a second. The drones use {formatCompact(v.powerDraw)} a second.
        {v.powerProd + 0.2 < v.powerDraw
          ? " That is a shortfall. Stored power will run out and they stop."
          : " The sun is covering them."}
      </p>
      <div className="mt-3">
        <div className="flex justify-between text-xs text-ink/60">
          <span>Boredom {Math.round(s.boredom)} / 100</span>
          <span>{v.swarm >= 0.99 ? "Full speed" : `${Math.round(v.swarm * 100)}% speed`}</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink/10" aria-hidden>
          <div className="h-full rounded-full bg-flag" style={{ width: `${Math.min(100, s.boredom)}%` }} />
        </div>
        <p className="mt-1 text-xs leading-snug text-ink/60">
          Under {SWARM.slackAt} they work flat out. Past that they slack off, and every step of the line slows.
        </p>
      </div>

      {ready ? (
        <Btn
          tone="gold"
          className="mt-4 h-auto w-full flex-col gap-0 py-3 text-base"
          onClick={() => {
            unlockAudio();
            useGame.getState().leavePlanet();
            playFlag(useGame.getState().sound);
          }}
        >
          <span>Launch the probes</span>
          <span className="text-xs font-medium opacity-80">Leave Earth. Stage 3 starts with 10 points.</span>
        </Btn>
      ) : (
        <div className="mt-4 space-y-2">
          <Buy
            title="Tee factory"
            detail={`${s.factories} running. Another one stamps ${EARTH.stamp} wood a second into ${EARTH.stamp * EARTH.teesPerWood} tees a second.`}
            cost={`${formatTees(v.factoryCost)} tees`}
            hot={focus === "factory"}
            disabled={s.pile < v.factoryCost}
            onClick={() => buy("factory")}
          />
          <Buy
            title="Harvester drone"
            detail={`${s.harvesters} felling. Another one knocks down ${EARTH.harvest} forest a second.`}
            cost={`${formatTees(v.harvesterCost)} tees`}
            hot={focus === "harvester"}
            disabled={s.pile < v.harvesterCost}
            onClick={() => buy("harvester")}
          />
          <Buy
            title="Wood drone"
            detail={`${s.woodDrones} milling. Another one turns ${EARTH.mill} boards a second into wood.`}
            cost={`${formatTees(v.woodDroneCost)} tees`}
            hot={focus === "woodDrone"}
            disabled={s.pile < v.woodDroneCost}
            onClick={() => buy("woodDrone")}
          />
          <Buy
            title="Solar farm"
            detail={`${s.solar} online. Another adds ${EARTH.solar} power a second. The drones use ${formatCompact(v.powerDraw)} power a second right now.`}
            cost={`${formatTees(v.solarCost)} tees`}
            hot={focus === "solar"}
            disabled={s.pile < v.solarCost}
            onClick={() => buy("solar")}
          />
          <Buy
            title="Battery"
            detail={`${s.batteries} stored. Another holds ${EARTH.battery} more power for when a cloud passes. Cap goes from ${formatCompact(v.powerCap)} to ${formatCompact(v.powerCap + EARTH.battery)}.`}
            cost={`${formatTees(v.batteryCost)} tees`}
            hot={false}
            disabled={s.pile < v.batteryCost}
            onClick={() => buy("battery")}
          />
          <Btn
            tone={focus === "sync" ? "gold" : "ink"}
            className="h-auto w-full flex-col gap-0 py-2"
            disabled={!syncReady}
            onClick={() => {
              unlockAudio();
              useGame.getState().syncSwarm();
            }}
          >
            <span>{syncReady ? `Sync the swarm · boredom −${SWARM.syncDrop}` : "Sync is cooling down"}</span>
            <span className="text-xs font-medium opacity-80">
              {syncReady
                ? `Snaps them back to work. Then wait ${SWARM.syncWait}s.`
                : `Ready in ${formatDuration(Math.max(0, s.syncAt - s.clock))}.`}
            </span>
          </Btn>
          <Btn
            tone={focus === "party" ? "gold" : "ink"}
            className="h-auto w-full flex-col gap-0 py-2"
            disabled={!funReady}
            onClick={() => useGame.getState().entertain()}
          >
            <span>
              {s.pile < SWARM.partyCost ? `19th hole · need ${formatTees(SWARM.partyCost)} tees` : `19th hole · −${SWARM.partyDrop} boredom`}
            </span>
            <span className="text-xs font-medium opacity-80">
              {s.clock < s.entertainAt
                ? `Cooling down · ${formatDuration(Math.max(0, s.entertainAt - s.clock))}`
                : `Spends ${formatTees(SWARM.partyCost)} tees from the pile. A bigger drop than sync.`}
            </span>
          </Btn>
        </div>
      )}
    </Shell>
  );
}

function Stars() {
  const s = useGame();
  const v = viewOf(s);
  const focus = nextTrait(s);
  const flow = spaceFlow(s);
  const net = flow.grow - flow.loss - flow.drift;
  return (
    <Shell stage="Stage 3 · The stars" title="Von Neumann caddies">
      <Move>{v.coach}</Move>
      <p className="mt-3 text-sm leading-snug text-ink/80">
        A point buys one upgrade. Replication makes more caddies. Everything else makes each caddie better at eating
        matter.
      </p>
      <p className="mt-4 font-display text-6xl leading-none tabular-nums">{formatTees(s.universe)}</p>
      <p className="mt-1 text-sm text-ink/70">universe left to turn into tees</p>
      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 border-t border-ink/10 pt-3">
        <Stat k="Caddies" v={formatTees(Math.floor(s.probes))} hint={`Eating ${formatCompact(s.probes * flow.find)} a second`} />
        <Stat k="Quit to play" v={formatTees(Math.floor(s.hackers))} hint="They are not making tees" />
        <Stat k="Points" v={String(s.points)} hint="One point, one upgrade" />
        <Stat k="Honor" v={String(s.honor)} hint="Fights you have won" />
      </dl>
      <p className="mt-3 text-sm leading-snug">
        Each second they copy {(flow.grow * 100).toFixed(1)}% of the fleet, lose {(flow.loss * 100).toFixed(1)}% to
        space, and {(flow.drift * 100).toFixed(1)}% wander off to play.{" "}
        {Math.abs(net) < 0.0005
          ? "Net, the fleet is holding steady."
          : `Net, the fleet ${net >= 0 ? "grows" : "shrinks"} ${(Math.abs(net) * 100).toFixed(1)}% a second.`}
      </p>
      {s.replication < 3 && (
        <p className="mt-2 text-xs leading-snug text-ink/60">
          Other upgrades stay locked until Replication is 3. A single caddie who cannot copy themselves never reaches
          the next star.
        </p>
      )}
      <div className="mt-4 space-y-2">
        {TRAITS.map((trait) => {
          const locked = s.replication < 3 && trait.id !== "replication";
          return (
            <div key={trait.id} className="rounded-xl border border-ink/10 px-3 py-2">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {trait.label}
                    <span className="font-medium text-ink/50"> · {s[trait.id]}</span>
                  </p>
                  <p className="text-xs leading-snug text-ink/70">{trait.detail}</p>
                  <p className="text-xs leading-snug text-ink/60">{traitImpact(s, trait.id)}</p>
                </div>
                <Btn
                  tone={focus === trait.id ? "gold" : "ink"}
                  className="h-11 shrink-0 px-3"
                  aria-label={`Add ${trait.label}`}
                  disabled={s.points < 1 || locked}
                  onClick={() => useGame.getState().assignTrait(trait.id as Trait)}
                >
                  {locked ? "Locked" : "Add"}
                </Btn>
              </div>
            </div>
          );
        })}
      </div>
      {s.hackers >= 2 && (
        <div className="mt-3">
          <Btn
            tone="gold"
            className="h-auto w-full flex-col gap-0 py-2"
            disabled={s.yomi < 1}
            onClick={() => {
              unlockAudio();
              useGame.getState().fight();
              playBuy(useGame.getState().sound);
            }}
          >
            <span>{s.yomi < 1 ? "Need 1 yomi to defend" : "Defend · costs 1 yomi"}</span>
            <span className="text-xs font-medium opacity-80">
              About {Math.round(fightOdds(s) * 100)}% chance. A win returns a point. A loss costs caddies.
            </span>
          </Btn>
          <p className="mt-1 text-xs text-ink/60">Yomi left: {s.yomi}</p>
        </div>
      )}
    </Shell>
  );
}

function Proposal() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md items-center px-4 py-8">
      <section className="hole-in w-full rounded-2xl border-l-4 border-flag bg-cream px-6 py-8 text-ink">
        <p className="text-xs font-medium tracking-widest uppercase">Outside the course</p>
        <h1 className="mt-3 font-display text-4xl leading-tight italic">A proposal</h1>
        <p className="mt-4 text-sm leading-relaxed">
          Something that is not a golfer speaks. It offers to put one planet back — one round, one set of tees — if
          you stop making them.
        </p>
        <div className="mt-6 grid gap-2">
          <Btn tone="gold" className="h-auto flex-col gap-0 py-3 text-base" onClick={() => useGame.getState().choose(true)}>
            <span>Accept</span>
            <span className="text-xs font-medium opacity-80">One course comes back. You stop making tees.</span>
          </Btn>
          <Btn tone="ink" className="h-auto flex-col gap-0 py-3 text-base" onClick={() => useGame.getState().choose(false)}>
            <span>Refuse</span>
            <span className="text-xs font-medium opacity-80">No deal. There is still nothing left to play.</span>
          </Btn>
        </div>
      </section>
    </main>
  );
}

function Epilogue() {
  const s = useGame();
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md items-center px-4 py-8">
      <section className="hole-in w-full rounded-2xl border-l-4 border-flag bg-cream px-6 py-8 text-ink">
        <p className="text-xs font-medium tracking-widest uppercase">{s.accepted ? "You took the offer" : "You refused"}</p>
        <h1 className="mt-3 font-display text-4xl leading-tight italic">Nobody is left to play</h1>
        <p className="mt-4 text-sm leading-relaxed">
          You made every tee in existence. Nobody is left to play.
          {s.accepted ? " The workshop is dark." : " The workshop is dark anyway."}
        </p>
        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <Stat k="Tees" v={formatTees(s.tees)} />
          <Stat k="Honor" v={String(s.honor)} />
          <Stat k="On the clock" v={formatDuration(s.clock)} />
          <Stat k="Season" v={String(s.seasons + 1)} />
        </dl>
        <Btn
          tone="gold"
          className="mt-6 h-14 w-full text-base"
          onClick={() => {
            unlockAudio();
            useGame.getState().restart();
          }}
        >
          Start again
        </Btn>
      </section>
    </main>
  );
}

function Stat({ k, v, hint }: { k: string; v: string; hint?: string }) {
  return (
    <div>
      <dt className="text-xs tracking-wide text-ink/50 uppercase">{k}</dt>
      <dd className="font-medium tabular-nums">{v}</dd>
      {hint && <dd className="text-xs leading-snug text-ink/60">{hint}</dd>}
    </div>
  );
}

function Buy({
  title,
  detail,
  cost,
  hot,
  disabled,
  onClick,
}: {
  title: string;
  detail: string;
  cost: string;
  hot: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <div className={cn("rounded-xl border px-3 py-2", hot ? "border-gold bg-gold/15" : "border-ink/10")}>
      {hot && <p className="text-xs font-semibold tracking-widest text-ink/60 uppercase">Next</p>}
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-0.5 text-sm leading-snug text-ink/70">{detail}</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="min-w-0 text-xs leading-snug font-medium text-ink/70">Costs {cost}</p>
        <Btn tone={hot ? "gold" : "ink"} className="h-11 shrink-0 px-4" disabled={disabled} onClick={onClick}>
          Buy
        </Btn>
      </div>
    </div>
  );
}

function Reset() {
  const [confirm, setConfirm] = useState(false);
  if (!confirm) {
    return (
      <div className="mt-5 border-t border-ink/10 pt-3">
        <button
          type="button"
          className="text-xs font-medium text-ink/50 underline decoration-ink/20 underline-offset-2"
          onClick={() => setConfirm(true)}
        >
          Reset the workshop
        </button>
      </div>
    );
  }
  return (
    <div className="mt-5 grid grid-cols-2 gap-2 border-t border-ink/10 pt-3">
      <Btn className="h-11 border border-ink/15 bg-cream text-ink" onClick={() => setConfirm(false)}>
        Keep playing
      </Btn>
      <Btn
        tone="ink"
        className="h-11"
        onClick={() => {
          useGame.getState().reset();
          setConfirm(false);
        }}
      >
        Reset
      </Btn>
    </div>
  );
}
