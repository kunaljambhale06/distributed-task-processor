import { useEffect, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

//TODO: - Fix the buttons logic, they are not working as expected. 
const API = axios.create({
  baseURL: "http://localhost:5000",
});

function App() {
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({});
  const [queue, setQueue] = useState({});

  const fetchData = async () => {
    try {
      const jobsRes = await API.get("/jobs");
      const statsRes = await API.get("/jobs/stats");
      const queueRes = await API.get("/jobs/queue-stats");

      

      const sorted = jobsRes.data.sort((a, b) => {
        const order = {
          failed: 0,
          pending: 1,
          processing: 2,
          completed: 3,
        };

        return order[a.status] - order[b.status];
      });

      setJobs(sorted);
      setStats(statsRes.data);
      setQueue(queueRes.data);

    } catch {
      toast.error("Fetch error");
    }
  };

  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, 2000);

    return () => clearInterval(interval);
  }, []);

  

  const resetSystem = async () => {
    const t = toast.loading("Resetting...");

    try {
      await API.post("/jobs/admin/reset");

      toast.success("System reset", { id: t });

      fetchData();
    } catch {
      toast.error("Reset failed", { id: t });
    }
  };

 

  const clearFailed = async () => {
    const t = toast.loading("Clearing failed...");

    try {
      await API.post("/jobs/clear-failed");

      toast.success("Failed queue cleared", { id: t });

      fetchData();
    } catch {
      toast.error("Clear failed", { id: t });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#333",
            color: "#fff",
          },
        }}
      />

      <h1 className="text-3xl font-bold mb-6">
        Distributed Task Dashboard
      </h1>

      {/* STATS */}

      <div className="grid grid-cols-5 gap-4 mb-6">

        <div className="bg-gray-800 p-4 rounded">
          Total
          <p>{stats.total}</p>
        </div>

        <div className="bg-yellow-700 p-4 rounded">
          Pending
          <p>{stats.pending}</p>
        </div>

        <div className="bg-blue-700 p-4 rounded">
          Processing
          <p>{stats.processing}</p>
        </div>

        <div className="bg-green-700 p-4 rounded">
          Completed
          <p>{stats.completed}</p>
        </div>

        <div className="bg-red-700 p-4 rounded">
          Failed
          <p>{stats.failed}</p>
        </div>

      </div>

      {/* QUEUE */}

      <div className="grid grid-cols-2 gap-4 mb-6">

        <div className="bg-gray-800 p-4 rounded">
          Job Queue
          <p>{queue.jobQueue}</p>
        </div>

        <div className="bg-red-800 p-4 rounded">
          Failed Queue
          <p>{queue.failed_jobs}</p>
        </div>

      </div>

      {/* BUTTONS */}

      <div className="flex gap-4 mb-6">

        <button
          onClick={clearFailed}
          className="bg-red-700 px-4 py-2 rounded"
        >
          Clear Failed Queue
        </button>

        <button
          onClick={resetSystem}
          className="bg-purple-700 px-4 py-2 rounded"
        >
          Reset System
        </button>

      </div>

      {/* TABLE */}

      <table className="w-full border border-gray-700">

        <thead className="bg-gray-700">

          <tr>

            <th className="border p-2">ID</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Retries</th>

          </tr>

        </thead>

        <tbody>

          {jobs.map((job) => (

            <tr key={job._id}>

              <td className="border p-2">
                {job._id.slice(-6)}
              </td>

              <td className="border p-2">
                {job.name}
              </td>

              <td className="border p-2">

                <span
                  className={
                    job.status === "failed"
                      ? "text-red-400 font-bold"
                      : job.status === "completed"
                      ? "text-green-400"
                      : job.status === "processing"
                      ? "text-yellow-400"
                      : "text-gray-300"
                  }
                >
                  {job.status}
                </span>

              </td>

              <td className="border p-2">
                {job.retries}
              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}

export default App;