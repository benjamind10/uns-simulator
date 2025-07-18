import { useState } from 'react';

interface BrokerFormProps {
  onAdd: (broker: {
    name: string;
    url: string;
    port: number;
    clientId: string;
    username?: string;
    password?: string;
  }) => void;
}

export default function BrokerForm({ onAdd }: BrokerFormProps) {
  const [form, setForm] = useState({
    name: '',
    url: '',
    port: 1883,
    clientId: '',
    username: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ ...form, port: Number(form.port) });
    setForm({
      name: '',
      url: '',
      port: 1883,
      clientId: '',
      username: '',
      password: '',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 space-y-4">
      {['name', 'url', 'port', 'clientId', 'username', 'password'].map(
        (field) => (
          <input
            key={field}
            name={field}
            type={field === 'port' ? 'number' : 'text'}
            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
            value={form[field as keyof typeof form]}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded dark:bg-gray-800 dark:text-white"
          />
        )
      )}
      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Add Broker
      </button>
    </form>
  );
}
