export const stringify = (value: any) =>
  JSON.stringify(
    value,
    (_, v) => {
      if (typeof v === 'bigint') {
        return v.toString();
      } else if (v === undefined) {
        return v;
      } else if (v.asHex !== undefined) {
        return v.asHex();
      } else {
        return v;
      }
    },
    2
  );
