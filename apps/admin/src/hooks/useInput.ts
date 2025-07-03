import { type ChangeEvent, useCallback, useState } from 'react';

type UseInputReturnType = [
  string,
  (e: ChangeEvent<HTMLInputElement>) => void,
  () => void,
];

function useInput(initialValue: string): UseInputReturnType {
  const [value, setValue] = useState(initialValue);

  const handler = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  }, []);

  const reset = useCallback(() => setValue(initialValue), [initialValue]);

  return [value, handler, reset];
}

export default useInput;
