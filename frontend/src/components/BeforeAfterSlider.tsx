interface Props {
  before: string;
  after: string;
  beforeAlt?: string;
  afterAlt?: string;
}

export function BeforeAfterSlider({ before, after, beforeAlt = "Before", afterAlt = "After" }: Props) {
  return (
    <div className="ba-section">
      <div className="ba-title">See the difference</div>
      {/* @ts-expect-error img-comparison-slider is a web component */}
      <img-comparison-slider className="ba-slider">
        <img slot="first" src={before} alt={beforeAlt} />
        <img slot="second" src={after} alt={afterAlt} />
      {/* @ts-expect-error web component closing tag */}
      </img-comparison-slider>
    </div>
  );
}
