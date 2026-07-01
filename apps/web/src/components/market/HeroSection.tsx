'use client';

import { Suspense, useEffect, useRef } from 'react';
import { SearchBar } from '@/components/market/SearchBar';
import { QuickChip } from '@/components/market/QuickChip';

const QUICK_CHIPS = [
  { label: 'PETR4', href: '/ativos/PETR4?class=STOCK_BR' },
  { label: 'VALE3', href: '/ativos/VALE3?class=STOCK_BR' },
  { label: 'ITUB4', href: '/ativos/ITUB4?class=STOCK_BR' },
  { label: 'BBDC4', href: '/ativos/BBDC4?class=STOCK_BR' },
  { label: 'BTC', href: '/ativos/BTC?class=CRYPTO' },
  { label: 'AAPL', href: '/ativos/AAPL?class=STOCK_US' },
];

const PARTICLES: { label: string; top: string; left: string; delay: string; duration: string }[] = [
  { label: '+2.4%', top: '30%', left: '8%',  delay: '0s',    duration: '6s'  },
  { label: '-0.7%', top: '55%', left: '15%', delay: '1.8s',  duration: '7s'  },
  { label: '+1.1%', top: '25%', left: '82%', delay: '0.7s',  duration: '5.5s'},
  { label: '+3.2%', top: '60%', left: '88%', delay: '2.5s',  duration: '6.5s'},
  { label: '-1.3%', top: '40%', left: '92%', delay: '0.3s',  duration: '7.5s'},
  { label: '+0.9%', top: '70%', left: '5%',  delay: '3.1s',  duration: '6s'  },
  { label: '+4.0%', top: '20%', left: '75%', delay: '1.2s',  duration: '8s'  },
  { label: '-0.5%', top: '75%', left: '70%', delay: '2.0s',  duration: '5s'  },
];

export function HeroSection() {
  return (
    <section
      className="relative overflow-hidden bg-background py-20 md:pb-28 md:pt-28"
      aria-label="Busca de ativos"
    >
      {/* WebGL Fluid Shader Background */}
      <ShaderBackground />

      {/* Ambient gradient orbs */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="hero-orb-a absolute -left-48 -top-48 h-[540px] w-[540px] rounded-full blur-3xl"
          style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 9%, transparent)' }}
        />
        <div
          className="hero-orb-b absolute -right-28 top-1/4 h-[380px] w-[380px] rounded-full blur-3xl"
          style={{ backgroundColor: 'color-mix(in srgb, var(--color-tertiary) 7%, transparent)' }}
        />
        <div
          className="hero-orb-c absolute -bottom-20 left-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full blur-2xl"
          style={{ backgroundColor: 'color-mix(in srgb, var(--color-tertiary-container) 8%, transparent)' }}
        />
      </div>

      {/* Floating particle numbers */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {PARTICLES.map((p) => (
          <span
            key={p.label + p.left}
            className="absolute font-mono text-[11px] font-semibold tabular-nums opacity-0"
            style={{
              top: p.top,
              left: p.left,
              color: p.label.startsWith('+') ? 'var(--color-profit)' : 'var(--color-loss)',
              animation: `float-particle ${p.duration} ease-in-out ${p.delay} infinite`,
            }}
          >
            {p.label}
          </span>
        ))}
      </div>

      {/* Content */}
      <div className="relative mx-auto max-w-3xl px-4">
        <div className="flex flex-col items-center gap-7 text-center">

          {/* Live badge */}
          <div className="hero-animate-1 inline-flex items-center gap-2 rounded-full border border-border/50 bg-surface/70 px-4 py-1.5 text-xs text-on-surface-variant backdrop-blur-sm">
            <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
            </span>
            Mercado em tempo real · B3, Cripto, Stocks US
          </div>

          {/* Headline */}
          <h1 className="hero-animate-2 max-w-2xl text-4xl font-bold tracking-tight text-on-surface md:text-5xl">
            Análise de ativos e{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-tertiary) 100%)' }}
            >
              acompanhamento de carteira
            </span>
          </h1>

          {/* Subtitle */}
          <p className="hero-animate-3 max-w-md text-lg leading-relaxed text-on-surface-variant">
            B3, criptos, stocks americanos e muito mais.
          </p>

          {/* Search bar */}
          <div className="hero-animate-4 w-full">
            <Suspense fallback={null}>
              <SearchBar variant="hero" />
            </Suspense>
          </div>

          {/* Quick chips */}
          <div className="hero-animate-5 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-on-surface-variant">Mais buscados:</span>
            {QUICK_CHIPS.map((chip) => (
              <QuickChip key={chip.label} label={chip.label} href={chip.href} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function syncSize() {
      if (!canvas) return;
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(syncSize);
      resizeObserver.observe(canvas);
    }
    syncSize();

    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return;

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

    const fs = `precision highp float;
varying vec2 v_texCoord;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_dark;

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

#define OCTAVES 6
float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = .5;
    for (int i = 0; i < OCTAVES; i++) {
        value += amplitude * noise(st);
        st *= 2.;
        amplitude *= .5;
    }
    return value;
}

void main() {
    vec2 st = v_texCoord;
    
    vec2 q = vec2(0.);
    q.x = fbm(st + 0.0 * u_time);
    q.y = fbm(st + vec2(1.0));

    vec2 r = vec2(0.);
    r.x = fbm(st + 1.0 * q + vec2(1.7, 9.2) + 0.15 * u_time);
    r.y = fbm(st + 1.0 * q + vec2(8.3, 2.8) + 0.126 * u_time);

    float f = fbm(st + r);

    vec3 color = vec3(0.0);

    if (u_dark > 0.5) {
        color = vec3(0.04, 0.04, 0.04); // Base neutra bem escura para mesclar bem em light/dark
        
        // Mesclar cores do design system da databolsa
        color = mix(color,
                    vec3(0.118, 0.204, 0.4), // brand.navy.800 #1E3466
                    clamp((f*f)*4.0, 0.0, 1.0));

        color = mix(color,
                    vec3(0.306, 0.765, 0.894), // brand.accent #4EC3E4
                    clamp(length(q), 0.0, 1.0) * 0.1);

        color = mix(color,
                    vec3(0.153, 0.337, 0.643), // brand.primary #2756A4
                    clamp(length(r.x), 0.0, 1.0) * 0.2);

        gl_FragColor = vec4((f*f*f + 0.6*f*f + 0.5*f) * color, 1.0);
    } else {
        // Modo claro: ondas pastel suaves integradas perfeitamente ao fundo claro #F4F8FF
        vec3 lightNavy = vec3(0.92, 0.94, 0.97);
        vec3 lightAccent = vec3(0.90, 0.96, 0.98);
        vec3 lightPrimary = vec3(0.88, 0.92, 0.97);

        color = vec3(1.0); // Base branca em light mode para mix-blend-multiply

        color = mix(color,
                    lightNavy,
                    clamp((f*f)*2.0, 0.0, 1.0));

        color = mix(color,
                    lightAccent,
                    clamp(length(q), 0.0, 1.0) * 0.15);

        color = mix(color,
                    lightPrimary,
                    clamp(length(r.x), 0.0, 1.0) * 0.25);

        gl_FragColor = vec4(color, 1.0);
    }
}`;

    function cs(type: number, src: string) {
      const s = gl!.createShader(type);
      if (!s) return null;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      return s;
    }

    const prog = gl.createProgram();
    if (!prog) return;
    const vertexShader = cs(gl.VERTEX_SHADER, vs);
    const fragmentShader = cs(gl.FRAGMENT_SHADER, fs);
    if (!vertexShader || !fragmentShader) return;

    gl.attachShader(prog, vertexShader);
    gl.attachShader(prog, fragmentShader);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    
    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    
    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');
    const uDark = gl.getUniformLocation(prog, 'u_dark');

    let mouse = { x: canvas.width / 2, y: canvas.height / 2 };
    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas!.getBoundingClientRect();
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = 1.0 - (event.clientY - rect.top) / rect.height;
        mouse.x = nx * canvas!.width;
        mouse.y = ny * canvas!.height;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    let animationFrameId: number;
    function render(t: number) {
      if (!gl || !canvas) return;
      if (!resizeObserver) syncSize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);
      if (uDark) {
        const isDark = document.documentElement.classList.contains('dark');
        gl.uniform1f(uDark, isDark ? 1.0 : 0.0);
      }
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    }
    
    render(0);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (resizeObserver) resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-25 dark:opacity-35 mix-blend-multiply dark:mix-blend-screen"
      style={{ display: 'block' }}
    />
  );
}
