/* eslint-disable react/jsx-no-comment-textnodes */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import jsQR from 'jsqr';
import { authedFetch } from '@/lib/authed-fetch';
import { Frame } from '@/components/geek-ui';
import { toast } from 'sonner';
import { X, Camera, Check } from 'lucide-react';

interface DetailResp {
  screening: { id: string; film_title: string; checkin_code: string };
  role: string | null;
  stats: { attend_count: number; signup_count: number };
}

interface ScanRecord {
  time: number;
  name: string;
  ok: boolean;
}

export default function ScanPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const sid = params.id;
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastScanRef = useRef<{ text: string; at: number } | null>(null);

  const [info, setInfo] = useState<DetailResp | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [records, setRecords] = useState<ScanRecord[]>([]);

  const load = useCallback(async () => {
    try {
      const d = await authedFetch<DetailResp>(`/api/screenings/${sid}`);
      if (d.role !== 'admin' && d.role !== 'officer') {
        setError('仅干事/管理员可扫码签到');
        return;
      }
      setInfo(d);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [sid]);

  useEffect(() => {
    load();
  }, [load]);

  const stopScan = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    return () => stopScan();
  }, [stopScan]);

  const handleQR = async (raw: string) => {
    // Anti-duplicate: same code within 3s ignored
    const now = Date.now();
    if (lastScanRef.current && lastScanRef.current.text === raw && now - lastScanRef.current.at < 3000) {
      return;
    }
    lastScanRef.current = { text: raw, at: now };

    let code: string | null = null;
    // Try URL format first: .../screenings/{sid}?ci=CODE
    try {
      const url = new URL(raw);
      const ci = url.searchParams.get('ci');
      if (ci) {
        // If URL has sid in path check consistency
        const m = url.pathname.match(/\/screenings\/([^/?#]+)/);
        if (m && m[1] !== sid) {
          toast.error('该二维码不属于当前场次');
          return;
        }
        code = ci;
      }
    } catch {
      // not a URL, fallback below
    }
    if (!code) {
      try {
        const parsed = JSON.parse(raw) as { sid?: string; code?: string };
        if (parsed.sid && parsed.sid !== sid) {
          toast.error('该二维码不属于当前场次');
          return;
        }
        code = parsed.code ?? null;
      } catch {
        code = raw;
      }
    }

    try {
      const resp = await authedFetch<{ display_name: string; already: boolean }>(
        `/api/screenings/${sid}/checkin`,
        {
          method: 'POST',
          body: JSON.stringify({ code }),
        }
      );
      const rec: ScanRecord = { time: now, name: resp.display_name, ok: true };
      setRecords((prev) => [rec, ...prev].slice(0, 30));
      toast.success(`${resp.display_name} · ${resp.already ? '已签到' : '签到成功'}`);
      // reload stats
      load();
    } catch (e) {
      const rec: ScanRecord = { time: now, name: (e as Error).message, ok: false };
      setRecords((prev) => [rec, ...prev].slice(0, 30));
      toast.error((e as Error).message);
    }
  };

  const startScan = async () => {
    if (scanning) return;
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      await video.play();
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

      const tick = () => {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imgData.data, imgData.width, imgData.height, {
            inversionAttempts: 'dontInvert',
          });
          if (code && code.data) {
            handleQR(code.data);
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (e) {
      toast.error('无法访问摄像头：' + (e as Error).message);
      setScanning(false);
    }
  };

  if (error) {
    return (
      <div className="max-w-xl mx-auto pt-16">
        <Frame label="ERROR" className="p-8 text-center">
          <div className="mono text-[10px] text-[color:var(--muted-foreground)] mb-3">// {error}</div>
          <button
            onClick={() => router.back()}
            className="mono text-[11px] px-4 py-2 border hair-line"
          >
            BACK
          </button>
        </Frame>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="mono text-xs text-[color:var(--muted-foreground)] dot-pulse py-16 text-center">
        ● LOADING
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b hair-line pb-4 flex items-center justify-between">
        <div>
          <div className="mono text-[11px] text-[color:var(--muted-foreground)]">// SCANNER</div>
          <h1 className="serif-title text-2xl mt-1">{info.screening.film_title}</h1>
        </div>
        <Link
          href={`/app/screenings/${sid}`}
          className="mono text-[11px] px-3 py-2 border hair-line hover:border-[color:var(--foreground)] transition-colors flex items-center gap-1.5"
        >
          <X className="w-3.5 h-3.5" strokeWidth={1.5} /> CLOSE
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="md:col-span-3">
          <Frame label={scanning ? 'LIVE · SCANNING' : 'CAMERA'}>
            <div className="relative aspect-square bg-black overflow-hidden">
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                muted
                playsInline
              />
              <canvas ref={canvasRef} className="hidden" />
              {/* Reticle */}
              <div className="absolute inset-8 border hair-line pointer-events-none">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[color:var(--phosphor)]" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[color:var(--phosphor)]" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[color:var(--phosphor)]" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[color:var(--phosphor)]" />
              </div>
              {!scanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white">
                  <div className="mono text-[10px] mb-4">// CLICK TO START</div>
                  <button
                    onClick={startScan}
                    className="mono text-[11px] px-6 py-3 bg-[color:var(--phosphor)] text-[color:var(--ink)] hover:bg-white transition-colors flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" strokeWidth={1.5} /> START SCAN
                  </button>
                </div>
              )}
            </div>
          </Frame>
          <div className="mono text-[10px] text-[color:var(--muted-foreground)] mt-3 leading-relaxed">
            将成员的邀请码 QR 或本场次二维码对准框内区域。也可在场次页面输入签到码。
          </div>
        </div>

        <div className="md:col-span-2">
          <Frame label={`RECENT · ${records.length}`}>
            <div className="max-h-[420px] overflow-auto divide-y divide-[color:var(--hair)]">
              {records.length === 0 ? (
                <div className="p-6 mono text-[10px] text-[color:var(--muted-foreground)] text-center">
                  // 尚未扫描
                </div>
              ) : (
                records.map((r) => (
                  <div key={r.time} className="px-4 py-3 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      {r.ok ? (
                        <Check className="w-3.5 h-3.5 text-[color:var(--phosphor)]" strokeWidth={2} />
                      ) : (
                        <X className="w-3.5 h-3.5 text-[color:var(--destructive)]" strokeWidth={2} />
                      )}
                      <span className="truncate">{r.name}</span>
                    </div>
                    <span className="mono text-[10px] text-[color:var(--muted-foreground)] flex-shrink-0">
                      {new Date(r.time).toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Frame>
          {scanning && (
            <button
              onClick={stopScan}
              className="w-full mt-3 mono text-[11px] px-4 py-2 border hair-line hover:border-[color:var(--destructive)] hover:text-[color:var(--destructive)] transition-colors"
            >
              STOP
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
