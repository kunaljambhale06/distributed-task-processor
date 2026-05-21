import { useEffect, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

const API = "/api/jobs";

const COLORS = [
  "#facc15",
  "#3b82f6",
  "#22c55e",
  "#ef4444",
];

export default function App() {
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({});
  const [queue, setQueue] = useState({});
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("dashboard");
  const [workers, setWorkers] = useState({});

  const fetchAll = async () => {
    try {
      const [j, s, q, w] = await Promise.all([
        axios.get(API),
        axios.get(`${API}/stats`),
        axios.get(`${API}/queue-stats`),
        axios.get(`${API}/workers`),
      ]);

      setWorkers(w.data);

      const sorted = [...j.data].sort((a, b) => {
        if (a.status === "failed") return -1;
        if (b.status === "failed") return 1;
        return 0;
      });

      setJobs(sorted);
      setStats(s.data);
      setQueue(q.data);
    } catch {
      toast.error("Fetch error");
    }
  };

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 3000);
    return () => clearInterval(t);
  }, []);

  const addJob = async () => {
    try {
      setLoading(true);
      await axios.post(`${API}/add`, { name: "Job" });
      toast.success("Job added");
      fetchAll();
    } catch {
      toast.error("Error");
    } finally {
      setLoading(false);
    }
  };

  const clearFailed = async () => {
    try {
      await axios.post(`${API}/clear-failed`);
      toast.success("Failed cleared");
      fetchAll();
    } catch {
      toast.error("Error");
    }
  };

  const reset = async () => {
    try {
      await axios.post(`${API}/admin/reset`);
      toast.success("System reset");
      fetchAll();
    } catch {
      toast.error("Error");
    }
  };

  const badge = (s) => {
    if (s === "failed")
      return <span className="bg-red-500 text-white px-2 py-1 rounded">FAILED</span>;

    if (s === "completed")
      return <span className="bg-green-500 text-white px-2 py-1 rounded">COMPLETED</span>;

    if (s === "pending")
      return <span className="bg-yellow-500 text-white px-2 py-1 rounded">PENDING</span>;

    if (s === "processing")
      return <span className="bg-blue-500 text-white px-2 py-1 rounded">PROCESSING</span>;
  };
  const chartData = [
    { name: "Pending", value: stats.pending || 0 },
    { name: "Processing", value: stats.processing || 0 },
    { name: "Completed", value: stats.completed || 0 },
    { name: "Failed", value: stats.failed || 0 },
  ];

  return (
    <div className="p-6">

      <Toaster position="top-right" />

      {/* ================= DASHBOARD ================= */}

      {view === "dashboard" && (
        <>

          <h1 className="text-2xl font-bold mb-4">
            Distributed Image Processing Dashboard
          </h1>

          {/* stats */}

          <div className="grid grid-cols-5 gap-4 mb-4">

            <div className="bg-gray-200 p-3 rounded">
              Total: {stats.total}
            </div>

            <div className="bg-yellow-200 p-3 rounded">
              Pending: {stats.pending}
            </div>

            <div className="bg-blue-200 p-3 rounded">
              Processing: {stats.processing}
            </div>

            <div className="bg-green-200 p-3 rounded">
              Completed: {stats.completed}
            </div>

            <div className="bg-red-200 p-3 rounded">
              Failed: {stats.failed}
            </div>

          </div>

          {/* queue */}

          <div className="bg-gray-100 p-3 rounded mb-4">

            <h2 className="font-bold mb-2">Queue Stats</h2>

            JobQueue: {queue.jobQueue} <br />
            FailedQueue: {queue.failed_jobs}

          </div>

          <div className="bg-gray-100 p-3 rounded mb-4">

            <h2 className="font-bold mb-2">Workers</h2>

            Active Workers: {workers.count}

          </div>

          {/* admin */}

          <div className="bg-gray-100 p-3 rounded mb-4">

            <h2 className="font-bold mb-2">Admin Actions</h2>

            <button
              onClick={addJob}
              className="bg-blue-500 text-white px-3 py-1 mr-2 rounded"
            >
              Add Job
            </button>

            <button
              onClick={clearFailed}
              className="bg-red-500 text-white px-3 py-1 mr-2 rounded"
            >
              Clear Failed
            </button>

            <button
              onClick={reset}
              className="bg-black text-white px-3 py-1 mr-2 rounded"
            >
              Reset
            </button>

            <button
              onClick={() => setView("analytics")}
              className="bg-purple-600 text-white px-3 py-1 rounded"
            >
              Analytics
            </button>

          </div>

          {/* table */}

          <table className="w-full border border-black">

            <thead>
              <tr className="bg-gray-300">

                <th className="border p-2">ID</th>

                <th className="border p-2">Name</th>

                <th className="border p-2">Type</th>

                <th className="border p-2">Status</th>

                <th className="border p-2">Retries</th>

                <th className="border p-2">Time</th>

                <th className="border p-2">Original</th>

                <th className="border p-2">Processed</th>

                <th className="border p-2">Worker</th>
              </tr>
            </thead>

            <tbody>

              {jobs.map((j) => (

                <tr key={j._id}>

                  <td className="border p-2">
                    {j._id.slice(-6)}
                  </td>

                  <td className="border p-2">
                    {j.name || "-"}
                  </td>

                  {/* NEW jobType */}
                  <td className="border p-2">
                    {j.jobType || "-"}
                  </td>

                  <td className="border p-2">
                    {badge(j.status)}
                  </td>

                  <td className="border p-2">
                    {j.retries || 0} / 3
                  </td>

                  {/* NEW time */}
                  <td className="border p-2">
                    {j.startedAt && j.finishedAt
                      ? Math.floor(
                        (new Date(j.finishedAt) -
                          new Date(j.startedAt)) /
                        1000
                      ) + "s"
                      : "-"}
                  </td>

                  {/* original */}
                  <td className="border p-2">

                    {j.jobType === "image" &&
                      j.status !== "failed" &&
                      j.imagePath ? (

                      <img
                         src={j.imagePath}
                        width="60"
                      />

                    ) : (
                      "-"
                    )}
                  </td>

                  {/* NEW processed */}
                  <td className="border p-2">

                    {j.status === "completed" && j.processedImagePath ? (
                      <img
                        src={j.processedImagePath}
                        width="60"
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="border p-2">
                    {j.workerId || "-"}
                  </td>
                </tr>

              ))}

            </tbody>

          </table>

        </>
      )}

      {/* ================= ANALYTICS ================= */}

      {view === "analytics" && (

        <div>

          <button
            onClick={() => setView("dashboard")}
            className="bg-black text-white px-3 py-1 mb-4"
          >
            Back
          </button>

          <h2 className="text-xl font-bold mb-4">
            Analytics
          </h2>

          <div className="flex gap-10">

            {/* PIE */}

            <PieChart width={300} height={300}>

              <Pie
                data={chartData}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={COLORS[index]}
                  />
                ))}
              </Pie>

              <Tooltip />

            </PieChart>


            {/* BAR */}

            <BarChart
              width={400}
              height={300}
              data={chartData}
            >

              <XAxis dataKey="name" />

              <YAxis />

              <Tooltip />

              <Legend />

              <Bar
                dataKey="value"
                fill="#3b82f6"
              />

            </BarChart>

          </div>

        </div>

      )}
    </div>
  );
}