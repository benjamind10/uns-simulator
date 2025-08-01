// import { useState, useRef, useEffect } from 'react';

// import type { ISchemaNode } from '../../types';

// interface NodePayloadSettingsTabProps {
//   onSave: (payloads: Record<string, Record<string, any>>) => void;
//   nodeIds: string[];
//   fetchNodesByIds?: (ids: string[]) => Promise<ISchemaNode[]>;
//   nodePayloads?: Record<string, Record<string, any>>; // <-- Fixed type
// }

// export default function NodePayloadSettings({
//   onSave,
//   nodeIds,
//   fetchNodesByIds,
//   nodePayloads = {},
// }: NodePayloadSettingsTabProps) {
//   const [nodes, setNodes] = useState<ISchemaNode[]>([]);
//   const [payloads, setPayloads] = useState<Record<string, Record<string, any>>>(
//     {}
//   );
//   const didInit = useRef(false);

//   // Fetch nodes by IDs or fallback to minimal node objects
//   useEffect(() => {
//     let isMounted = true;
//     if (fetchNodesByIds && nodeIds.length > 0) {
//       fetchNodesByIds(nodeIds).then((fetched) => {
//         if (isMounted) setNodes(fetched);
//       });
//     } else {
//       setNodes(
//         nodeIds.map((id) => ({
//           id,
//           name: id,
//           kind: 'metric',
//           parent: null,
//           path: id,
//           order: 0,
//         }))
//       );
//     }
//     return () => {
//       isMounted = false;
//     };
//   }, [nodeIds, fetchNodesByIds]);

//   // Initialize payloads from nodePayloads prop ONLY ONCE when nodes are loaded
//   useEffect(() => {
//     if (nodes.length > 0 && !didInit.current) {
//       const metricNodeIds = nodes
//         .filter((node) => node.kind === 'metric')
//         .map((node) => node.id);

//       const merged: Record<string, Record<string, any>> = {};
//       metricNodeIds.forEach((id) => {
//         merged[id] = {
//           ...(nodePayloads[id] ?? { quality: '', value: '', timestamp: '' }),
//         };
//       });

//       setPayloads(merged);
//       didInit.current = true;
//     }
//   }, [nodes, nodePayloads]);

//   // Only show nodes with kind === 'metric'
//   const metricNodes = nodes.filter((node) => node.kind === 'metric');

//   // Handle field changes
//   const handleFieldChange = (
//     nodeId: string,
//     field: string,
//     value: string | number
//   ) => {
//     setPayloads((prev) => ({
//       ...prev,
//       [nodeId]: {
//         ...prev[nodeId],
//         [field]: value,
//       },
//     }));
//   };

//   // Add a new custom field
//   const handleAddField = (nodeId: string, field: string) => {
//     if (!field) return;
//     setPayloads((prev) => ({
//       ...prev,
//       [nodeId]: {
//         ...prev[nodeId],
//         [field]: '',
//       },
//     }));
//   };

//   // Remove a custom field
//   const handleRemoveField = (nodeId: string, field: string) => {
//     setPayloads((prev) => {
//       const updated = { ...prev[nodeId] };
//       delete updated[field];
//       return { ...prev, [nodeId]: updated };
//     });
//   };

//   // Clear all payloads for visible metric nodes
//   const handleClear = () => {
//     const cleared: Record<string, Record<string, any>> = {};
//     metricNodes.forEach((node) => {
//       cleared[node.id] = { quality: '', value: '', timestamp: '' };
//     });
//     setPayloads(cleared);
//   };

//   return (
//     <div>
//       <h2 className="text-lg font-bold mb-4">Node Payloads</h2>
//       {metricNodes.map((node) => (
//         <div
//           key={node.id}
//           className="mb-6 p-4 rounded bg-gray-100 dark:bg-gray-800"
//         >
//           <h3 className="font-semibold mb-2">
//             Node: {node.name ? node.path : node.id}
//           </h3>
//           <div className="space-y-2">
//             {Object.entries(payloads[node.id] ?? {}).map(([field, value]) => (
//               <div key={field} className="flex items-center gap-2">
//                 <label className="block text-sm w-32">{field}</label>
//                 <input
//                   type={typeof value === 'number' ? 'number' : 'text'}
//                   value={value}
//                   onChange={(e) =>
//                     handleFieldChange(
//                       node.id,
//                       field,
//                       typeof value === 'number'
//                         ? Number(e.target.value)
//                         : e.target.value
//                     )
//                   }
//                   className="w-full px-2 py-1 rounded border"
//                 />
//                 {!['quality', 'value', 'timestamp'].includes(field) && (
//                   <button
//                     type="button"
//                     className="ml-2 text-red-500 hover:text-red-700"
//                     onClick={() => handleRemoveField(node.id, field)}
//                   >
//                     Remove
//                   </button>
//                 )}
//               </div>
//             ))}
//             <AddFieldInput nodeId={node.id} onAdd={handleAddField} />
//           </div>
//         </div>
//       ))}
//       <div className="flex justify-end gap-2">
//         <button
//           className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded font-semibold"
//           onClick={handleClear}
//           type="button"
//         >
//           Clear
//         </button>
//         <button
//           className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
//           onClick={() => onSave(payloads)}
//           type="button"
//         >
//           Save Node Payloads
//         </button>
//       </div>
//     </div>
//   );
// }

// // Helper component for adding a new field
// function AddFieldInput({
//   nodeId,
//   onAdd,
// }: {
//   nodeId: string;
//   onAdd: (nodeId: string, field: string) => void;
// }) {
//   const [field, setField] = useState('');
//   return (
//     <div className="flex items-center gap-2 mt-2">
//       <input
//         type="text"
//         placeholder="Add field"
//         value={field}
//         onChange={(e) => setField(e.target.value)}
//         className="w-32 px-2 py-1 rounded border"
//       />
//       <button
//         type="button"
//         className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
//         onClick={() => {
//           if (field.trim()) {
//             onAdd(nodeId, field.trim());
//             setField('');
//           }
//         }}
//       >
//         Add
//       </button>
//     </div>
//   );
// }

export default function NodePayloadSettings() {
  return (
    <div className="flex items-center justify-center h-40">
      <span className="text-lg text-gray-500 dark:text-gray-400 font-semibold">
        Work In Progress
      </span>
    </div>
  );
}
