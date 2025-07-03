import { useCallback, useState } from 'react';

type OnChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => void;

function useInputs<T>(initialForm: T): [T, OnChangeHandler, () => void] {
  const [form, setForm] = useState<T>(initialForm);

  const onChange: OnChangeHandler = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const reset = useCallback(() => setForm(initialForm), [initialForm]);

  return [form, onChange, reset];
}

export default useInputs;
