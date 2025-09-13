import useAuth from '../hooks/useAuth';

export default function Login() {
  const { login } = useAuth();
  return (
    <div className="p-4 flex justify-center items-center h-full">
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded"
        onClick={login}
      >
        Login
      </button>
    </div>
  );
}
