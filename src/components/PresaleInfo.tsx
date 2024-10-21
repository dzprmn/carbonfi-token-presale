// import React from 'react';
// import { usePresale } from '../contexts/PresaleContext';
//
// interface PresaleData {
//     info: {
//         softCap: string;
//         hardCap: string;
//         tokenPrice: string;
//         minContribution: string;
//         maxContribution: string;
//     };
//     sold: string;
//     softCap: boolean;
//     totalRaised: string;
// }
//
// const PresaleInfo: React.FC = () => {
//     const { presaleData, loading, error } = usePresale();
//
//     if (loading) return <div className="text-center p-8">Loading presale information...</div>;
//     if (error) return <div className="text-red-500 text-center p-8">{error}</div>;
//
//     const { info, sold, softCap, totalRaised } = presaleData as PresaleData;
//
//     const calculateProgress = (): number => {
//         return (parseFloat(sold) / parseFloat(info.hardCap)) * 100;
//     };
//
//     return (
//         <div className="p-6">
//             <h2 className="text-2xl font-bold mb-6 text-center text-green-400">Presale Information</h2>
//
//             <div className="mb-6">
//                 <div className="flex justify-between items-center mb-2">
//                     <span className="text-white font-semibold">Progress</span>
//                 </div>
//                 <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
//                     <div
//                         className="bg-green-400 h-full rounded-full transition-all duration-500 ease-out"
//                         style={{ width: `${calculateProgress()}%` }}
//                     ></div>
//                 </div>
//                 <div className="flex justify-between text-sm mt-2">
//                     <span className="text-gray-400">Soft Cap: {info.softCap} CAFI</span>
//                     <span className="text-gray-400">Hard Cap: {info.hardCap} CAFI</span>
//                 </div>
//             </div>
//
//             <div className="space-y-4">
//                 <InfoItem label="Token Price" value={`1 BNB = ${1 / parseFloat(info.tokenPrice)} CAFI`} />
//                 <InfoItem label="Total Raised" value={`${totalRaised} BNB`} />
//                 <InfoItem label="Tokens Sold" value={`${sold} CAFI`} />
//                 <InfoItem label="Soft Cap Reached" value={softCap ? 'Yes' : 'No'} valueColor={softCap ? 'text-green-400' : 'text-red-400'} />
//                 <InfoItem label="Min Contribution" value={`${info.minContribution} BNB`} />
//                 <InfoItem label="Max Contribution" value={`${info.maxContribution} BNB`} />
//             </div>
//         </div>
//     );
// };
//
// interface InfoItemProps {
//     label: string;
//     value: string;
//     valueColor?: string;
// }
//
// const InfoItem: React.FC<InfoItemProps> = ({ label, value, valueColor = 'text-white' }) => {
//     return (
//         <div className="flex justify-between items-center">
//             <span className="text-gray-400">{label}:</span>
//             <span className={`font-semibold ${valueColor}`}>{value}</span>
//         </div>
//     );
// };
//
// export default PresaleInfo;