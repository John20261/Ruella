import * as Haptics from 'expo-haptics';
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { GestureDetector, usePanGesture, usePinchGesture, useSimultaneousGestures, useTapGesture } from 'react-native-gesture-handler';
import Animated, { Easing, runOnJS, useAnimatedProps, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, G, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';

import { Icon } from '@/components/ui/icon';
import { RText } from '@/components/ui/r-text';
import { cityDistricts } from '@/content/districts';
import { cityGeo } from '@/content/geo';
import { getCity } from '@/lib/catalog';
import type { LatLng } from '@/lib/geo';
import { useRuellaTheme } from '@/theme/theme-context';
import { fonts } from '@/theme/tokens';

export type MapMarker = LatLng & {
  id: string;
  label: string;
  kind: 'visit' | 'gem' | 'restaurant';
  done?: boolean;
  /** Trajet pour arriver ici : pointillés si transports en commun. */
  transit?: boolean;
};

type Props = {
  cityId: string;
  markers: MapMarker[];
  base?: LatLng & { name: string };
  user?: LatLng | null;
  highlightId?: string;
  onSelect?: (id: string) => void;
  style?: object;
  /** Marge haute réservée (barre en verre par-dessus la carte). */
  insetTop?: number;
  /** Hauteur cachée en bas (feuille posée sur la carte) : la journée est cadrée au-dessus. */
  insetBottom?: number;
  /** Carte manipulable (glisser, pincer, double-toucher). */
  interactive?: boolean;
  /** Position des boutons « recentrer » et « ma position », depuis le bas. */
  controlsBottom?: number;
};

type Cam = { z: number; ox: number; oy: number };
const HOME: Cam = { z: 1, ox: 0, oy: 0 };

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * Carte légère de Ruella : la ville est dessinée par l'app (Vltava, parcs, quartiers),
 * sans tuiles ni clé d'API. Quelques ko, instantanée, et elle marche hors ligne.
 */
export function CityMap({ cityId, markers, base, user, highlightId, onSelect, style, insetTop = 0, insetBottom = 0, interactive = true, controlsBottom = 12 }: Props) {
  const { colors } = useRuellaTheme();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const geo = cityGeo(cityId);
  // Nouvelle journée ou nouvelles étapes : la caméra revient d'elle-même sur l'ensemble.
  const markerKey = markers.map((m) => m.id).join(',');
  const [camState, setCamState] = useState<{ key: string; cam: Cam }>({ key: markerKey, cam: HOME });
  const cam = camState.key === markerKey ? camState.cam : HOME;
  const setCam = (next: Cam | ((c: Cam) => Cam)) =>
    setCamState((st) => {
      const current = st.key === markerKey ? st.cam : HOME;
      return { key: markerKey, cam: typeof next === 'function' ? next(current) : next };
    });

  const view = useMemo(() => {
    const pts: LatLng[] = [...markers, ...(base ? [base] : [])];
    if (user && pts.length && pts.some((p) => Math.abs(p.lat - user.lat) < 0.03 && Math.abs(p.lng - user.lng) < 0.04)) pts.push(user);
    if (!pts.length) pts.push(getCity(cityId)?.center ?? { lat: 50.0875, lng: 14.4214 });
    let minLat = Math.min(...pts.map((p) => p.lat));
    let maxLat = Math.max(...pts.map((p) => p.lat));
    let minLng = Math.min(...pts.map((p) => p.lng));
    let maxLng = Math.max(...pts.map((p) => p.lng));
    const minSpan = 0.009;
    if (maxLat - minLat < minSpan) {
      const c = (maxLat + minLat) / 2;
      minLat = c - minSpan / 2;
      maxLat = c + minSpan / 2;
    }
    if (maxLng - minLng < minSpan * 1.5) {
      const c = (maxLng + minLng) / 2;
      minLng = c - minSpan * 0.75;
      maxLng = c + minSpan * 0.75;
    }
    const kx = Math.cos(((minLat + maxLat) / 2) * (Math.PI / 180));
    return { minLat, maxLat, minLng, maxLng, kx };
  }, [markers, base, user, cityId]);

  const proj = useMemo(() => {
    const pad = 34;
    const top = insetTop + pad;
    const w = Math.max(1, size.w - pad * 2);
    const h = Math.max(1, size.h - top - pad - insetBottom);
    const spanX = (view.maxLng - view.minLng) * view.kx;
    const spanY = view.maxLat - view.minLat;
    const scale = Math.min(w / spanX, h / spanY);
    const offX = pad + (w - spanX * scale) / 2;
    const offY = top + (h - spanY * scale) / 2;
    const xy = (lat: number, lng: number) => ({
      x: (offX + (lng - view.minLng) * view.kx * scale) * cam.z + cam.ox,
      y: (offY + (view.maxLat - lat) * scale) * cam.z + cam.oy,
    });
    const pxPerM = (scale * cam.z) / 111000;
    return { xy, pxPerM };
  }, [size, view, insetTop, insetBottom, cam]);

  // ------------------------------------------------------------- gestes
  // Pendant le geste, on déplace l'image (fluide, sur le fil d'interface) ; au lâcher,
  // on redessine la carte à la nouvelle échelle pour garder des repères nets et de taille constante.
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const sc = useSharedValue(1);
  const panning = useSharedValue(false);
  const pinching = useSharedValue(false);

  useLayoutEffect(() => {
    tx.set(0);
    ty.set(0);
    sc.set(1);
  }, [cam, tx, ty, sc]);

  const commit = (dx: number, dy: number, s: number) => {
    setCam((c) => {
      const z = Math.max(0.7, Math.min(9, c.z * s));
      const k = z / c.z;
      const fx = size.w / 2;
      const fy = (size.h + insetTop - insetBottom) / 2;
      return { z, ox: (c.ox - fx) * k + fx + dx, oy: (c.oy - fy) * k + fy + dy };
    });
  };

  const pan = usePanGesture({
    enabled: interactive,
    minDistance: 6,
    onActivate: () => {
      'worklet';
      panning.set(true);
    },
    onUpdate: (e) => {
      'worklet';
      tx.set(e.translationX);
      ty.set(e.translationY);
    },
    onFinalize: () => {
      'worklet';
      if (!panning.get()) return;
      panning.set(false);
      if (!pinching.get()) runOnJS(commit)(tx.get(), ty.get(), sc.get());
    },
  });
  const pinch = usePinchGesture({
    enabled: interactive,
    onActivate: () => {
      'worklet';
      pinching.set(true);
    },
    onUpdate: (e) => {
      'worklet';
      sc.set(Math.max(0.5, Math.min(6, e.scale)));
    },
    onFinalize: () => {
      'worklet';
      if (!pinching.get()) return;
      pinching.set(false);
      if (!panning.get()) runOnJS(commit)(tx.get(), ty.get(), sc.get());
    },
  });
  const doubleTap = useTapGesture({
    enabled: interactive,
    numberOfTaps: 2,
    onActivate: () => {
      'worklet';
      runOnJS(commit)(0, 0, 2);
    },
  });
  const gestures = useSimultaneousGestures(pan, pinch, doubleTap);
  const moving = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.get() }, { translateY: ty.get() }, { scale: sc.get() }],
  }));

  const recenter = () => {
    Haptics.selectionAsync().catch(() => {});
    setCam(HOME);
  };
  const focusUser = () => {
    if (!user) return;
    Haptics.selectionAsync().catch(() => {});
    setCam((c) => {
      const z = Math.max(c.z, 2.5);
      const p0 = { x: (proj.xy(user.lat, user.lng).x - c.ox) / c.z, y: (proj.xy(user.lat, user.lng).y - c.oy) / c.z };
      return { z, ox: size.w / 2 - p0.x * z, oy: (size.h + insetTop - insetBottom) / 2 - p0.y * z };
    });
  };
  const moved = cam !== HOME;

  // Halo animé sur l'étape en cours.
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad) }), -1, false);
  }, [pulse]);
  const haloProps = useAnimatedProps(() => ({ r: 14 + pulse.value * 16, opacity: 0.45 * (1 - pulse.value) }));

  const onLayout = (e: LayoutChangeEvent) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  const ready = size.w > 0 && size.h > 0;
  const toPath = (pts: [number, number][]) =>
    pts.map(([lat, lng], i) => {
      const { x, y } = proj.xy(lat, lng);
      return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');

  const riverWidth = Math.max(6, Math.min(90, 160 * proj.pxPerM));

  // Étapes au même endroit (place, horloge, tour…) : on les écarte un peu pour qu'elles restent lisibles.
  const placed: { x: number; y: number }[] = [];
  const pos = markers.map((m) => {
    let { x, y } = proj.xy(m.lat, m.lng);
    for (let k = 0; k < 6 && placed.some((q) => Math.hypot(q.x - x, q.y - y) < 22); k++) {
      const a = (k * Math.PI) / 3 + Math.PI / 4;
      x += Math.cos(a) * 20;
      y += Math.sin(a) * 20;
    }
    placed.push({ x, y });
    return { x, y };
  });

  const routeStart = base ?? markers[0];
  const segments = markers.map((m, i) => {
    const from = i === 0 ? routeStart : markers[i - 1];
    if (!from || from === m) return null;
    const a = i === 0 ? proj.xy(from.lat, from.lng) : pos[i - 1];
    const b = pos[i];
    // Légère courbe : plus lisible qu'une ligne droite et plus vivant.
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const bend = 0.14;
    const c = { x: mx - dy * bend, y: my + dx * bend };
    const done = m.done && (i === 0 || markers[i - 1].done);
    return { id: m.id, d: `M${a.x.toFixed(1)} ${a.y.toFixed(1)} Q${c.x.toFixed(1)} ${c.y.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`, done, transit: m.transit };
  });

  const nextId = highlightId ?? markers.find((m) => !m.done)?.id;

  return (
    <View style={[styles.root, { backgroundColor: colors.map.bg }, style]} onLayout={onLayout}>
      {ready ? (
        <>
          <GestureDetector gesture={gestures}>
          <Animated.View style={[StyleSheet.absoluteFill, moving]}>
          <Svg width={size.w} height={size.h} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {geo?.parks.map((p, i) => (
              <Polygon
                key={`p${i}`}
                points={p.ring.map(([lat, lng]) => {
                  const { x, y } = proj.xy(lat, lng);
                  return `${x.toFixed(1)},${y.toFixed(1)}`;
                }).join(' ')}
                fill={colors.map.park}
              />
            ))}
            {geo?.river.map((l, i) => (
              <Path key={`r${i}`} d={toPath(l)} stroke={colors.map.water} strokeWidth={riverWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            ))}
            {geo?.canals?.map((l, i) => (
              <Path key={`c${i}`} d={toPath(l)} stroke={colors.map.water} strokeWidth={Math.max(3, riverWidth * 0.22)} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            ))}
            {cityDistricts(cityId).map((d) => {
              const { x, y } = proj.xy(d.lat, d.lng);
              if (x < 20 || y < insetTop + 10 || x > size.w - 20 || y > size.h - 10) return null;
              return (
                <SvgText key={d.id} x={x} y={y} fill={colors.map.label} fontSize={10} fontFamily={fonts.bold} letterSpacing={1.2} textAnchor="middle">
                  {d.short.toUpperCase()}
                </SvgText>
              );
            })}

            {segments.map((s) =>
              s ? (
                <Path
                  key={`s${s.id}`}
                  d={s.d}
                  stroke={s.done ? colors.map.routeDone : colors.map.route}
                  strokeWidth={s.transit ? 3 : 4}
                  strokeDasharray={s.transit ? '2 7' : undefined}
                  strokeLinecap="round"
                  fill="none"
                  opacity={s.done ? 1 : 0.9}
                />
              ) : null,
            )}

            {base ? (
              <G>
                {(() => {
                  const { x, y } = proj.xy(base.lat, base.lng);
                  return (
                    <>
                      <Rect x={x - 11} y={y - 11} width={22} height={22} rx={7} fill={colors.text} />
                      <SvgText x={x} y={y + 4.5} fill={colors.background} fontSize={12} fontFamily={fonts.heavy} textAnchor="middle">
                        H
                      </SvgText>
                    </>
                  );
                })()}
              </G>
            ) : null}

            {markers.map((m, i) => {
              const { x, y } = pos[i];
              const tone = m.kind === 'gem' ? colors.gem : m.kind === 'restaurant' ? colors.tiles.mint.ink : colors.map.route;
              const fill = m.done ? colors.surfaceAlt : tone;
              const ink = m.done ? colors.textMuted : m.kind === 'gem' ? colors.pills.gem.ink : colors.background;
              const isNext = m.id === nextId;
              return (
                <G key={m.id}>
                  {isNext ? <AnimatedCircle cx={x} cy={y} fill={tone} animatedProps={haloProps} /> : null}
                  {m.kind === 'gem' ? (
                    <Rect x={x - 10} y={y - 10} width={20} height={20} rx={5} fill={fill} stroke={colors.map.bg} strokeWidth={2} transform={`rotate(45 ${x} ${y})`} />
                  ) : (
                    <Circle cx={x} cy={y} r={isNext ? 14 : 12} fill={fill} stroke={colors.map.bg} strokeWidth={2.5} />
                  )}
                  {m.done ? (
                    <Path d={`M${x - 5} ${y} l3.5 3.5 l6.5 -7`} stroke={ink} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  ) : (
                    <SvgText x={x} y={y + 4} fill={ink} fontSize={11} fontFamily={fonts.heavy} textAnchor="middle">
                      {String(i + 1)}
                    </SvgText>
                  )}
                </G>
              );
            })}

            {user ? (() => {
              const { x, y } = proj.xy(user.lat, user.lng);
              if (x < 0 || y < 0 || x > size.w || y > size.h) return null;
              return (
                <G>
                  <Circle cx={x} cy={y} r={16} fill={colors.map.user} opacity={0.18} />
                  <Circle cx={x} cy={y} r={7} fill={colors.map.user} stroke="#FFFFFF" strokeWidth={2.5} />
                </G>
              );
            })() : null}
          </Svg>

          {onSelect
            ? markers.map((m, i) => {
                const { x, y } = pos[i];
                return (
                  <Pressable
                    key={`hit${m.id}`}
                    onPress={() => onSelect(m.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Étape ${i + 1} : ${m.label}${m.done ? ', faite' : ''}`}
                    style={[styles.hit, { left: x - 22, top: y - 22 }]}
                  />
                );
              })
            : null}
          </Animated.View>
          </GestureDetector>
          {interactive ? (
            <View style={[styles.controls, { bottom: controlsBottom }]} pointerEvents="box-none">
              {user ? (
                <Pressable onPress={focusUser} accessibilityRole="button" accessibilityLabel="Centrer sur ma position" style={[styles.ctrl, { backgroundColor: colors.surface }]}>
                  <Icon name="navigate" size={20} color={colors.map.user} />
                </Pressable>
              ) : null}
              {moved ? (
                <Pressable onPress={recenter} accessibilityRole="button" accessibilityLabel="Revoir toute la journée" style={[styles.ctrl, { backgroundColor: colors.surface }]}>
                  <Icon name="route" size={20} color={colors.text} />
                </Pressable>
              ) : null}
            </View>
          ) : null}
          <RText style={[styles.osm, { color: colors.map.label }]}>© OpenStreetMap</RText>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { overflow: 'hidden' },
  hit: { position: 'absolute', width: 44, height: 44, borderRadius: 22 },
  controls: { position: 'absolute', right: 12, gap: 10 },
  ctrl: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  osm: { position: 'absolute', left: 10, bottom: 6, fontSize: 9, lineHeight: 12, fontFamily: fonts.semibold },
});
