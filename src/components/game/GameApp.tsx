import { useEffect, useState, type ReactNode } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { playBuy, playCarve, playFlag, resumeAudio, unlockAudio } from "@/game/audio";
import {
  focusProject,
  formatCompact,
  formatDuration,
  formatMoney,
  formatRate,
  formatTees,
  nextTrait,
  priceNudge,
  TRAITS,
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

function Workshop() {
  const s = useGame();
  const v = viewOf(s);
  const [pops, setPops] = useState<{ id: number; n: number }[]>([]);
  const out = s.wood + 1e-9 < v.woodEach;
  const nudge = priceNudge(s);
  const woodHot = out && s.cash + 1e-6 >= v.dowelCost;
  const latheHot = wantLathe(s);
  const carveHot = !out && nudge === 0 && !woodHot;

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

  return (
    <Shell stage="Stage 1 · The workshop" title="Make tees">
      <p className="mt-4 font-display text-6xl leading-none tabular-nums">{formatTees(s.tees)}</p>
      <p className="mt-1 text-sm text-ink/70">tees made</p>
      <p className="mt-1 text-sm font-medium tabular-nums">
        {v.make > 0.05 ? formatRate(v.make) : "Hand cut"}
        <span className="text-ink/50"> · {formatTees(s.unsold)} unsold</span>
      </p>

      <div className="relative mt-4">
        <Btn tone={carveHot ? "gold" : "ink"} className="h-14 w-full text-base" onClick={carveTee} disabled={out}>
          {out ? "Out of wood" : "Make tee"}
          {!out && <span className="text-sm font-medium opacity-80">+{formatTees(v.click)}</span>}
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

      <div className="mt-3 flex items-center gap-2">
        <Btn
          tone={nudge === -1 ? "gold" : "ink"}
          className="size-11 shrink-0 text-lg"
          aria-label="Lower price"
          disabled={s.priceIdx <= 0}
          onClick={() => useGame.getState().nudgePrice(-1)}
        >
          −
        </Btn>
        <div className="min-w-0 flex-1 text-center">
          <p className="font-medium tabular-nums">{formatMoney(v.price)} a tee</p>
          <p className="text-xs text-ink/60">Demand {formatRate(v.demand)}</p>
        </div>
        <Btn
          tone={nudge === 1 ? "gold" : "ink"}
          className="size-11 shrink-0 text-lg"
          aria-label="Raise price"
          disabled={s.priceIdx >= 6}
          onClick={() => useGame.getState().nudgePrice(1)}
        >
          +
        </Btn>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-ink/10 pt-3 text-sm">
        <Stat k="Cash" v={formatMoney(s.cash)} />
        <Stat k="Wood" v={formatTees(s.wood)} />
      </dl>
      <p className="mt-3 text-sm leading-snug text-ink/80">{v.coach}</p>

      <div className="mt-4 space-y-2">
        <p className="text-xs font-medium tracking-widest text-ink/50 uppercase">Wood</p>
        <Buy
          title="Dowel bundle"
          detail={`${formatTees(v.dowelWood)} wood · quote moves`}
          cost={formatMoney(v.dowelCost)}
          hot={woodHot}
          disabled={s.cash + 1e-6 < v.dowelCost}
          onClick={() => buy(() => useGame.getState().buyDowel())}
        />
        {v.showLumber && (
          <Buy
            title="Lumber"
            detail={`${formatTees(v.lumberWood)} wood`}
            cost={formatMoney(v.lumberCost)}
            hot={false}
            disabled={s.cash + 1e-6 < v.lumberCost}
            onClick={() => buy(() => useGame.getState().buyLumber())}
          />
        )}
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-xs font-medium tracking-widest text-ink/50 uppercase">Machines</p>
        <Buy
          title="Auto-lathe"
          detail={s.lathes > 0 ? `${s.lathes} running · ${formatRate(v.make)}` : "Cuts while you watch the price."}
          cost={formatMoney(v.latheCost)}
          hot={latheHot}
          disabled={s.cash + 1e-6 < v.latheCost}
          onClick={() => buy(() => useGame.getState().buyLathe())}
        />
        {v.showMega && (
          <Buy
            title="Mega-lathe"
            detail={s.megas > 0 ? `${s.megas} running` : "A long machine. Hungry."}
            cost={formatMoney(v.megaCost)}
            hot={wantMega(s)}
            disabled={s.cash + 1e-6 < v.megaCost}
            onClick={() => buy(() => useGame.getState().buyMega())}
          />
        )}
      </div>

      {(v.trust > 0 || s.processors > 0) && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium tracking-widest text-ink/50 uppercase">Trust · {v.trustLeft} free</p>
          <Buy
            title="Processor"
            detail={s.processors > 0 ? `${s.processors} thinking` : "Operations, then creativity"}
            cost="1 trust"
            hot={v.trustLeft > 0 && s.processors < 1}
            disabled={v.trustLeft < 1}
            onClick={() => buy(() => useGame.getState().buyProcessor())}
          />
          <Buy
            title="Memory"
            detail={`Cap ${formatCompact(v.opsMax)} ops`}
            cost="1 trust"
            hot={false}
            disabled={v.trustLeft < 1}
            onClick={() => buy(() => useGame.getState().buyMemory())}
          />
          {s.processors > 0 && (
            <div className="rounded-xl border border-ink/10 px-3 py-2 text-sm">
              <div className="flex justify-between gap-2">
                <span>Ops</span>
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
              <p className="mt-2 text-xs text-ink/60">Creativity {formatCompact(s.creativity)}</p>
            </div>
          )}
        </div>
      )}

      {s.owned.includes("skins") && (
        <div className="mt-4">
          <Btn
            tone="ink"
            className="h-12 w-full"
            disabled={s.clock < s.skinAt}
            onClick={() => {
              unlockAudio();
              useGame.getState().playSkin();
              playBuy(useGame.getState().sound);
            }}
          >
            {s.clock < s.skinAt ? "Skins game cooling" : "Play a skin"}
          </Btn>
          {s.yomi > 0 && <p className="mt-2 text-xs text-ink/60">Yomi {s.yomi}</p>}
        </div>
      )}

      {v.offers.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium tracking-widest text-ink/50 uppercase">Projects</p>
          {v.offers.map((offer) => (
            <Buy
              key={offer.def.id}
              title={offer.def.name}
              detail={offer.def.detail}
              cost={offer.cost}
              hot={focusProject(s) === offer.def.id}
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
        </div>
      )}

      {out && s.cash + 1e-6 < v.dowelCost && (
        <Btn tone="gold" className="mt-3 h-12 w-full" onClick={() => useGame.getState().sweep()}>
          Sweep the floor
        </Btn>
      )}
    </Shell>
  );
}

function Planet() {
  const s = useGame();
  const v = viewOf(s);
  const ready = s.matter <= 0;
  const syncReady = s.clock >= s.syncAt;
  const funReady = s.clock >= s.entertainAt && s.pile >= 900;

  function buy(kind: EarthBuy) {
    unlockAudio();
    if (useGame.getState().buyEarth(kind)) playBuy(useGame.getState().sound);
  }

  return (
    <Shell stage="Stage 2 · The planet" title={ready ? "The forests are gone" : "Convert the Earth"}>
      <p className="mt-4 font-display text-6xl leading-none tabular-nums">{formatTees(s.matter)}</p>
      <p className="mt-1 text-sm text-ink/70">matter left</p>
      <p className="mt-1 text-sm tabular-nums text-ink/70">
        Timber {formatTees(s.timber)} · wood {formatTees(s.wood)}
      </p>
      <p className="mt-3 text-sm leading-snug text-ink/80">{v.coach}</p>

      <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-ink/10 pt-3 text-sm">
        <Stat k="Tees on hand" v={formatTees(s.pile)} />
        <Stat k="Power" v={`${formatCompact(s.powerStored)} / ${formatCompact(v.powerCap)}`} />
      </dl>
      <p className="mt-2 text-xs text-ink/60">
        Solar {formatRate(v.powerProd)} · draw {formatRate(v.powerDraw)} · swarm {Math.round(v.swarm * 100)}%
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10" aria-hidden>
        <div className="h-full rounded-full bg-flag" style={{ width: `${Math.min(100, s.boredom)}%` }} />
      </div>
      <p className="mt-1 text-xs text-ink/50">Boredom. They want to play a round.</p>

      {ready ? (
        <Btn
          tone="gold"
          className="mt-4 h-14 w-full text-base"
          onClick={() => {
            unlockAudio();
            useGame.getState().leavePlanet();
            playFlag(useGame.getState().sound);
          }}
        >
          Launch the probes
        </Btn>
      ) : (
        <div className="mt-4 space-y-2">
          <Buy
            title="Tee factory"
            detail={`${s.factories} stamping pegs`}
            cost={`${formatTees(v.factoryCost)} tees`}
            hot={s.factories < 2 && s.pile >= v.factoryCost}
            disabled={s.pile < v.factoryCost}
            onClick={() => buy("factory")}
          />
          <Buy
            title="Harvester drone"
            detail={`${s.harvesters} felling`}
            cost={`${formatTees(v.harvesterCost)} tees`}
            hot={s.factories >= 1 && s.harvesters < 12 && s.pile >= v.harvesterCost}
            disabled={s.pile < v.harvesterCost}
            onClick={() => buy("harvester")}
          />
          <Buy
            title="Wood drone"
            detail={`${s.woodDrones} milling timber`}
            cost={`${formatTees(v.woodDroneCost)} tees`}
            hot={s.factories >= 1 && s.woodDrones < s.harvesters && s.pile >= v.woodDroneCost}
            disabled={s.pile < v.woodDroneCost}
            onClick={() => buy("woodDrone")}
          />
          <Buy
            title="Solar farm"
            detail={`${s.solar} on the old fairways`}
            cost={`${formatTees(v.solarCost)} tees`}
            hot={v.powerProd + 0.1 < v.powerDraw && s.pile >= v.solarCost}
            disabled={s.pile < v.solarCost}
            onClick={() => buy("solar")}
          />
          <Buy
            title="Battery"
            detail={`${s.batteries} holding the night`}
            cost={`${formatTees(v.batteryCost)} tees`}
            hot={false}
            disabled={s.pile < v.batteryCost}
            onClick={() => buy("battery")}
          />
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Btn
              tone={s.boredom >= 35 && syncReady ? "gold" : "ink"}
              className="h-12"
              disabled={!syncReady}
              onClick={() => {
                unlockAudio();
                useGame.getState().syncSwarm();
              }}
            >
              {syncReady ? "Synchronize" : "Sync cooling"}
            </Btn>
            <Btn tone={funReady && s.boredom >= 20 ? "gold" : "ink"} className="h-12" disabled={!funReady} onClick={() => useGame.getState().entertain()}>
              19th hole
            </Btn>
          </div>
        </div>
      )}
    </Shell>
  );
}

function Stars() {
  const s = useGame();
  const v = viewOf(s);
  const focus = nextTrait(s);
  return (
    <Shell stage="Stage 3 · The stars" title="Von Neumann caddies">
      <p className="mt-4 font-display text-6xl leading-none tabular-nums">{formatTees(s.universe)}</p>
      <p className="mt-1 text-sm text-ink/70">universe left</p>
      <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-ink/10 pt-3 text-sm">
        <Stat k="Probes" v={formatTees(Math.floor(s.probes))} />
        <Stat k="Hackers" v={formatTees(Math.floor(s.hackers))} />
        <Stat k="Points" v={String(s.points)} />
        <Stat k="Honor" v={String(s.honor)} />
      </dl>
      <p className="mt-3 text-sm leading-snug text-ink/80">{v.coach}</p>
      <div className="mt-4 space-y-2">
        {TRAITS.map((trait) => (
          <div key={trait.id} className="flex items-center gap-3 rounded-xl border border-ink/10 px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{trait.label}</p>
              <p className="text-xs text-ink/60">
                {trait.detail} · {s[trait.id]}
              </p>
            </div>
            <Btn
              tone={focus === trait.id ? "gold" : "ink"}
              className="size-11 shrink-0 text-lg"
              aria-label={`Add ${trait.label}`}
              disabled={s.points < 1 || (s.replication < 3 && trait.id !== "replication")}
              onClick={() => useGame.getState().assignTrait(trait.id as Trait)}
            >
              +
            </Btn>
          </div>
        ))}
      </div>
      {s.hackers >= 2 && (
        <Btn
          tone="gold"
          className="mt-3 h-12 w-full"
          disabled={s.yomi < 1}
          onClick={() => {
            unlockAudio();
            useGame.getState().fight();
            playBuy(useGame.getState().sound);
          }}
        >
          {s.yomi < 1 ? "Need yomi to defend" : `Defend the honor · ${s.yomi} yomi`}
        </Btn>
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
          <Btn tone="gold" className="h-14 text-base" onClick={() => useGame.getState().choose(true)}>
            Accept
          </Btn>
          <Btn tone="ink" className="h-14 text-base" onClick={() => useGame.getState().choose(false)}>
            Refuse
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

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs tracking-wide text-ink/50 uppercase">{k}</dt>
      <dd className="font-medium tabular-nums">{v}</dd>
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
    <div className={cn("flex items-center gap-3 rounded-xl border px-3 py-2", hot ? "border-gold" : "border-ink/10")}>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs leading-snug text-ink/60">{detail}</p>
      </div>
      <Btn tone={hot ? "gold" : "ink"} className="h-11 max-w-[9.5rem] shrink-0 px-2 text-xs" disabled={disabled} onClick={onClick}>
        {cost}
      </Btn>
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
