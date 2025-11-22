import { AlertTriangle, TrendingDown, Users, CloudRain, IndianRupee } from 'lucide-react';

const ProblemSection = () => {
  const problems = [
    {
      icon: <TrendingDown className="w-8 h-8 text-red-500" />,
      title: "Wrong Pricing",
      description: "Farmers don't get fair market prices for their crops due to information gaps.",
      stat: "40% below market rate"
    },
    {
      icon: <Users className="w-8 h-8 text-orange-500" />,
      title: "Middlemen Dependency",
      description: "Heavy reliance on intermediaries reduces farmer profits significantly.",
      stat: "60% profit loss"
    },
    {
      icon: <CloudRain className="w-8 h-8 text-blue-500" />,
      title: "Weather Risks",
      description: "Unpredictable weather patterns cause massive crop losses without proper guidance.",
      stat: "25% crop loss annually"
    },
    {
      icon: <IndianRupee className="w-8 h-8 text-purple-500" />,
      title: "Inflation Impact",
      description: "Rising costs and inflation affect both farmers and consumers nationwide.",
      stat: "15% price increase"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-red-50 to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-red-100 rounded-full mb-6">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-700 font-medium">The Current Reality</span>
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Challenges Farmers Face Today
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Despite being the backbone of our economy, farmers struggle with systemic issues 
            that prevent them from earning fair profits and accessing modern farming solutions.
          </p>
        </div>

        {/* Problems Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {problems.map((problem, index) => (
            <div 
              key={index}
              className="card-field hover:shadow-lg transition-all duration-300 group"
            >
              <div className="mb-4">
                {problem.icon}
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {problem.title}
              </h3>
              
              <p className="text-gray-600 mb-4">
                {problem.description}
              </p>
              
              <div className="text-sm font-bold text-red-600 bg-red-100 px-3 py-1 rounded-full inline-block">
                {problem.stat}
              </div>
            </div>
          ))}
        </div>

        {/* Visual Impact */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                The Farmer's Dilemma
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex-shrink-0 mt-1"></div>
                  <div>
                    <div className="font-semibold text-gray-900">Limited Market Access</div>
                    <div className="text-gray-600">Farmers sell to local mandis at low prices due to lack of broader market reach.</div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex-shrink-0 mt-1"></div>
                  <div>
                    <div className="font-semibold text-gray-900">Information Gap</div>
                    <div className="text-gray-600">No real-time pricing, weather updates, or market demand insights.</div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex-shrink-0 mt-1"></div>
                  <div>
                    <div className="font-semibold text-gray-900">Supply Chain Issues</div>
                    <div className="text-gray-600">Complex distribution chains increase costs for everyone.</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-r from-red-400 to-orange-400 rounded-2xl p-8 text-center text-white">
                <div className="text-6xl font-bold mb-4">₹2.5L</div>
                <div className="text-xl font-semibold mb-2">Average Annual Loss</div>
                <div className="text-red-100">Per farming family due to these challenges</div>
              </div>
              
              {/* Floating stats */}
              <div className="absolute -top-4 -right-4 bg-white rounded-lg shadow-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">85%</div>
                <div className="text-sm text-gray-600">Small farmers</div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 bg-white rounded-lg shadow-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">60%</div>
                <div className="text-sm text-gray-600">Population dependent</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;