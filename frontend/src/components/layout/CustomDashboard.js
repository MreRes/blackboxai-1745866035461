import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import DashboardWidget from './DashboardWidget';
import { dashboardAPI } from '../../utils/api';

const initialWidgets = [
  { id: '1', type: 'summary', title: 'Financial Summary' },
  { id: '2', type: 'transactions', title: 'Recent Transactions' },
  { id: '3', type: 'budgets', title: 'Budget Overview' },
  { id: '4', type: 'goals', title: 'Goal Progress' }
];

const CustomDashboard = () => {
  const [widgets, setWidgets] = useState(initialWidgets);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserWidgets();
  }, []);

  const fetchUserWidgets = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getUserWidgets();
      if (response.data.data.widgets && response.data.data.widgets.length > 0) {
        setWidgets(response.data.data.widgets);
      }
    } catch (error) {
      console.error('Error fetching user widgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const reordered = Array.from(widgets);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);

    setWidgets(reordered);

    try {
      await dashboardAPI.saveUserWidgets(reordered);
    } catch (error) {
      console.error('Error saving widget order:', error);
    }
  };

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Customizable Dashboard</h2>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="dashboard-widgets">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-4"
            >
              {widgets.map((widget, index) => (
                <Draggable key={widget.id} draggableId={widget.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="border rounded p-4 bg-gray-50"
                    >
                      <DashboardWidget type={widget.type} title={widget.title} />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default CustomDashboard;
