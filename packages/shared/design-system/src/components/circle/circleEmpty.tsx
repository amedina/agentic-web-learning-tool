interface CircleEmptyProps {
  color?: string;
}

const CircleEmpty = ({ color = '#BDBDBD' }: CircleEmptyProps) => (
  <div
    className="w-2.5 h-2.5 shrink-0 rounded-full border-2 border-solid"
    style={{ borderColor: color }}
  />
);

export default CircleEmpty;
