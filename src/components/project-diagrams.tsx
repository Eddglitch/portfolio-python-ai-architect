const DIAGRAMS = ["syntage", "rag", "cloud", "invi"] as const;

export function ProjectDiagrams({ activeId }: { activeId: string }) {
  return (
    <div className="diagram-stage" aria-hidden="true">
      {DIAGRAMS.map((id) => (
        <div key={id} className={"float-diagram d-" + id + (activeId === id ? " is-on" : "")}>
          {id === "syntage" ? <Syntage /> : null}
          {id === "rag" ? <Rag /> : null}
          {id === "cloud" ? <Cloud /> : null}
          {id === "invi" ? <Invi /> : null}
        </div>
      ))}
    </div>
  );
}

function Syntage() {
  return (
    <svg className="diagram-svg" viewBox="0 0 340 210">
      <text className="dname" x="0" y="26">
        CFDI
      </text>
      <path id="syn-spine" className="stroke-mid" d="M132 52 C148 88 116 124 140 160 C156 186 120 198 132 204" />
      <path className="stroke-quiet" d="M108 64 H132" />
      <path className="stroke-quiet" d="M108 112 H128" />
      <path className="stroke-quiet" d="M108 164 H136" />
      <path id="syn-r1" className="stroke-live flow" d="M140 70 H196" />
      <path id="syn-r2" className="stroke-quiet flow flow-b" d="M136 104 H196" />
      <path id="syn-r3" className="stroke-quiet flow flow-c" d="M142 142 H196" />
      <path id="syn-r4" className="stroke-live flow flow-d" d="M134 178 H196" />
      <circle className="node-core" cx="100" cy="64" r="4" />
      <circle className="node-core" cx="100" cy="112" r="4" />
      <circle className="node-strong" cx="100" cy="164" r="4.5" />
      <circle className="node-core" cx="204" cy="70" r="3.5" />
      <circle className="node-core" cx="204" cy="104" r="3.5" />
      <circle className="node-core" cx="204" cy="142" r="3.5" />
      <circle className="node-core" cx="204" cy="178" r="3.5" />
      <text className="node-label" x="0" y="68">
        RFC
      </text>
      <text className="node-label" x="0" y="116">
        entity_id
      </text>
      <text className="node-label" x="0" y="168">
        tablero
      </text>
      <text className="node-label" x="214" y="74">
        concentración
      </text>
      <text className="node-label" x="214" y="108">
        aging
      </text>
      <text className="node-label" x="214" y="146">
        cancelaciones
      </text>
      <text className="node-label" x="214" y="182">
        nómina
      </text>
      <circle className="bead" r="3">
        <animateMotion dur="7s" repeatCount="indefinite">
          <mpath href="#syn-spine" />
        </animateMotion>
      </circle>
    </svg>
  );
}

function Rag() {
  return (
    <svg className="diagram-svg" viewBox="0 0 300 210">
      <text className="dname" x="0" y="26">
        RAG
      </text>
      <circle className="stroke-quiet" cx="150" cy="118" r="74" />
      <circle className="stroke-mid dash-slow" cx="150" cy="118" r="52" />
      <circle className="stroke-live rag-arc" cx="150" cy="118" r="52" />
      <circle className="stroke-quiet" cx="150" cy="118" r="28" />
      <circle className="stroke-mid dash-slow rag-arc rag-arc-rev" cx="150" cy="118" r="28" />
      <circle className="node-strong" cx="150" cy="118" r="4.5" />
      <circle className="node-core" cx="150" cy="44" r="3.5" />
      <circle className="node-core" cx="224" cy="118" r="3.5" />
      <circle className="node-core" cx="150" cy="192" r="3.5" />
      <circle className="node-core" cx="76" cy="118" r="3.5" />
      <text className="node-label" x="150" y="36" textAnchor="middle">
        PDF
      </text>
      <text className="node-label" x="236" y="122">
        API
      </text>
      <text className="node-label" x="150" y="206" textAnchor="middle">
        código
      </text>
      <text className="node-label" x="64" y="122" textAnchor="end">
        MD
      </text>
      <text className="node-label node-label-strong" x="162" y="114">
        índice
      </text>
    </svg>
  );
}

function Cloud() {
  return (
    <svg className="diagram-svg" viewBox="0 0 300 210">
      <text className="dname" x="0" y="26">
        Cloud
      </text>
      <path
        className="stroke-quiet"
        d="M150 48c62 6 112 28 104 78-8 52-48 86-104 78-56 8-100-26-108-78C38 76 88 54 150 48Z"
      />
      <path
        className="stroke-mid dash-slow"
        d="M150 64c48 4 86 24 80 62-6 36-36 64-80 58-44 6-76-22-82-58-6-38 34-66 82-62Z"
      />
      <path id="cld-a" className="stroke-live flow" d="M150 86C122 104 108 118 102 138" />
      <path id="cld-b" className="stroke-live flow flow-b" d="M150 86C178 104 194 118 200 138" />
      <path id="cld-c" className="stroke-quiet flow flow-c" d="M118 150C140 132 164 132 186 150" />
      <circle className="node-strong" cx="150" cy="78" r="4.5" />
      <circle className="node-core" cx="96" cy="150" r="4.5" />
      <circle className="node-core" cx="206" cy="150" r="4.5" />
      <text className="node-label" x="150" y="68" textAnchor="middle">
        Azure
      </text>
      <text className="node-label" x="96" y="172" textAnchor="middle">
        S3
      </text>
      <text className="node-label" x="206" y="172" textAnchor="middle">
        Ollama
      </text>
      <circle className="bead" r="3">
        <animateMotion dur="5.8s" repeatCount="indefinite">
          <mpath href="#cld-a" />
        </animateMotion>
      </circle>
      <circle className="bead" r="3">
        <animateMotion dur="6.6s" repeatCount="indefinite">
          <mpath href="#cld-b" />
        </animateMotion>
      </circle>
      <circle className="bead" r="3">
        <animateMotion dur="7.4s" repeatCount="indefinite">
          <mpath href="#cld-c" />
        </animateMotion>
      </circle>
    </svg>
  );
}

function Invi() {
  return (
    <svg className="diagram-svg" viewBox="0 0 300 210">
      <text className="dname" x="0" y="26">
        INVI
      </text>
      <g className="stroke-mid">
        <rect x="8" y="78" width="46" height="58" rx="3" />
        <rect x="16" y="70" width="46" height="58" rx="3" />
        <rect x="24" y="62" width="46" height="58" rx="3" />
        <path d="M34 84H62M34 94H58M34 104H54" />
      </g>
      <text className="node-label" x="32" y="148" textAnchor="middle">
        expediente
      </text>
      <path id="invi-in" className="stroke-quiet flow" d="M78 96C104 96 112 112 128 120" />
      <ellipse className="stroke-quiet" cx="196" cy="118" rx="78" ry="46" transform="rotate(-10 196 118)" />
      <ellipse className="stroke-mid dash-slow" cx="196" cy="118" rx="52" ry="30" transform="rotate(8 196 118)" />
      <ellipse className="stroke-live" cx="196" cy="118" rx="18" ry="11" />
      <line className="stroke-live scan" x1="132" y1="84" x2="268" y2="84" />
      <text className="node-label" x="196" y="62" textAnchor="middle">
        KML
      </text>
      <text className="node-label" x="292" y="176" textAnchor="end">
        GeoJSON
      </text>
      <text className="node-label node-label-strong" x="196" y="122" textAnchor="middle">
        match
      </text>
      <text className="node-label" x="86" y="58">
        OCR
      </text>
      <circle className="bead" r="3">
        <animateMotion dur="6.2s" repeatCount="indefinite">
          <mpath href="#invi-in" />
        </animateMotion>
      </circle>
    </svg>
  );
}
