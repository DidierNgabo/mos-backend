export const QueryBooleanTransform = (value: string) => {
  switch (value) {
    case '0':
    case 'false':
      return false;
    case '1':
    case 'true':
      return true;
    default:
      return value;
  }
};

//conver value to array if user passes in single value

export const QueryArrayTransform = (value: any) => {
  if (Array.isArray(value)) return value;
  return [value];
};

export const findDuplicates = <T>(arr: T[]): T[] => {
  return arr.filter((item, index) => arr.indexOf(item) !== index);
};
