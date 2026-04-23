interface CircleProps {
  color: string;
}

const Circle = ({ color }: CircleProps) => (
  <div
    className="w-2.5 shrink-0 h-2.5 rounded-full flex items-center justify-center"
    style={{ backgroundColor: color }}
  />
);

export default Circle;
