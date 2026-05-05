'use client';

import React, { useState, useEffect } from 'react';
import { Tree, TreeNode } from 'react-organizational-chart';

const StyledNode = ({ node }: { node: any }) => {
  return (
    <div className="inline-block p-4 border-2 border-indigo-500 rounded-xl bg-white dark:bg-gray-800 shadow-md min-w-[200px] text-center cursor-pointer hover:shadow-lg transition">
      <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto mb-2 font-bold text-xl">
        {node.name.charAt(0)}
      </div>
      <h3 className="font-bold text-gray-900 dark:text-white text-lg">{node.name}</h3>
      <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 my-1">{node.position || 'موظف'}</p>
      {node.department && (
        <span className="inline-block mt-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs font-medium">
          {node.department}
        </span>
      )}
    </div>
  );
};

export default function OrgChartPage() {
    const [treeData, setTreeData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchChart = async () => {
            try {
                const res = await fetch('/api/hr/org-chart');
                const result = await res.json();
                if (result.success) {
                    setTreeData(result.data);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchChart();
    }, []);

    const renderNode = (node: any) => {
        return (
            <TreeNode key={node.id} label={<StyledNode node={node} />}>
                {node.children && node.children.map((child: any) => renderNode(child))}
            </TreeNode>
        );
    };

    if (loading) return <div className="p-8 text-indigo-600">جاري تحميل الهيكل التنظيمي (Org Chart)...</div>;

    if (treeData.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500">
                لا توجد بيانات موظفين مسجلة أو لم يتم تعيين مدراء لبناء الهيكل التنظيمي.
            </div>
        );
    }

    return (
        <div className="p-8 max-w-full overflow-x-auto space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow flex justify-between items-center border-b-4 border-indigo-600 sticky left-0 right-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">الهيكل التنظيمي للشركة (Org Chart)</h1>
                    <p className="text-gray-500 mt-1">عرض شجري تفاعلي لتسلسل الإدارة والموظفين.</p>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-xl border border-gray-200 dark:border-gray-700 shadow-inner overflow-x-auto" style={{ minHeight: '600px' }}>
                <div className="min-w-max mx-auto flex justify-center py-8">
                    {/* If there's a single CEO/Root */}
                    {treeData.length === 1 ? (
                        <Tree
                            lineWidth={'3px'}
                            lineColor={'#818cf8'} // indigo-400
                            lineBorderRadius={'12px'}
                            label={<StyledNode node={treeData[0]} />}
                        >
                            {treeData[0].children && treeData[0].children.map((child: any) => renderNode(child))}
                        </Tree>
                    ) : (
                        /* Multiple Roots (e.g. Board of Directors) */
                        <div className="flex gap-16 justify-center">
                            {treeData.map((rootNode: any) => (
                                <Tree
                                    key={rootNode.id}
                                    lineWidth={'3px'}
                                    lineColor={'#818cf8'}
                                    lineBorderRadius={'12px'}
                                    label={<StyledNode node={rootNode} />}
                                >
                                    {rootNode.children && rootNode.children.map((child: any) => renderNode(child))}
                                </Tree>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
