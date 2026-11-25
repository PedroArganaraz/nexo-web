const PASOS = [
  {
    titulo: "Contanos tu idea",
    descripcion:
      "Compartinos qué necesitás, las medidas y las referencias que te gustan.",
  },
  {
    titulo: "Lo diseñamos juntos",
    descripcion:
      "Definimos el diseño, los materiales, las terminaciones y el presupuesto.",
  },
  {
    titulo: "Lo hacemos realidad",
    descripcion:
      "Coordinamos su fabricación y entrega para que llegue a tu espacio.",
  },
];

export default function PasosDisenoAMedida() {
  return (
    <section aria-labelledby="disenos-a-medida" className="text-center">
      <h2
        id="disenos-a-medida"
        className="font-helvetica font-bold text-2xl md:text-3xl text-[#1a1a1a]"
      >
        Diseños a medida
      </h2>
      <ol className="mt-8 md:mt-10 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
        {PASOS.map((paso, i) => (
          <li key={paso.titulo} className="flex flex-col items-center">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a1a1a] text-sm font-semibold text-white"
            >
              {i + 1}
            </span>
            <h3 className="mt-3 font-helvetica font-semibold text-base text-[#1a1a1a]">
              <span className="sr-only">{`Paso ${i + 1}: `}</span>
              {paso.titulo}
            </h3>
            <p className="mt-1 max-w-xs text-sm leading-relaxed text-text-secondary">
              {paso.descripcion}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
