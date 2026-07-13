def clean_rich_text(value):
  if value is None:
    return ""
  if not isinstance(value, str):
    return str(value)
  return value.replace("\x00", "")
