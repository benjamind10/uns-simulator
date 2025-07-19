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
    <form
      onSubmit={handleSubmit}
      className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md mx-auto mb-8 transition-colors"
    >
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 text-center">
        Add Broker
      </h2>

      {['name', 'url', 'port', 'clientId', 'username', 'password'].map(
        (field) => (
          <input
            key={field}
            name={field}
            type={field === 'port' ? 'number' : 'text'}
            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
            value={form[field as keyof typeof form]}
            onChange={handleChange}
            className="w-full mb-4 px-4 py-2 rounded 
                       bg-white dark:bg-gray-900 
                       text-gray-800 dark:text-white 
                       border border-gray-300 dark:border-gray-700 
                       placeholder-gray-400 dark:placeholder-gray-500 
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )
      )}

      <button
        type="submit"
        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
      >
        Add Broker
      </button>
    </form>
  );
}
