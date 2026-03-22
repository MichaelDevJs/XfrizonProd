const ISO_TIMEZONE_SUFFIX = /(?:[zZ]|[+-]\d{2}:\d{2})$/;

export const parseLocalDateTime = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value !== "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (ISO_TIMEZONE_SUFFIX.test(value)) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/,
  );

  if (!match) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const [
    ,
    year,
    month,
    day,
    hour,
    minute,
    second = "0",
    millisecond = "0",
  ] = match;

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
    Number(millisecond.padEnd(3, "0")),
  );
};

export const formatLocalDate = (value, options) => {
  const parsed = parseLocalDateTime(value);
  return parsed ? parsed.toLocaleDateString(undefined, options) : "";
};

export const formatLocalTime = (value, options) => {
  const parsed = parseLocalDateTime(value);
  return parsed ? parsed.toLocaleTimeString(undefined, options) : "";
};
