function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">

      <div className="bg-white p-5 rounded-lg shadow">
        <h3 className="text-gray-500">Total Menu</h3>
        <p className="text-3xl font-bold mt-2">120</p>
      </div>

      <div className="bg-white p-5 rounded-lg shadow">
        <h3 className="text-gray-500">Orders</h3>
        <p className="text-3xl font-bold mt-2">85</p>
      </div>

      <div className="bg-white p-5 rounded-lg shadow">
        <h3 className="text-gray-500">Revenue</h3>
        <p className="text-3xl font-bold mt-2">$3,500</p>
      </div>

    </div>
  );
}

export default StatsCards;