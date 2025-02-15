import Select from "~/components/select";

type Item = { id: string };

interface TeamSelectProps {
  items: Item[];
  value: Item;
  onChange: (value: Item) => void;
}

export default function TeamSelect(props: TeamSelectProps) {
  return (
    <Select
      name="team"
      items={props.items}
      defaultValue={props.value?.id || (props.items && props.items[0]?.id)}
      onChange={(value) =>
        props.onChange(props.items.find(({ id }) => id === value))
      }
    />
  );
}
