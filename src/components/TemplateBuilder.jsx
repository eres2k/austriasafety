import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

export default function TemplateBuilder({ onSave }) {
  const [questions, setQuestions] = useState([]);
  const [title, setTitle] = useState('New Template');

  useEffect(() => {
    // load existing templates if needed
  }, []);

  function handleDragEnd(result) {
    if (!result.destination) return;
    const items = Array.from(questions);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    setQuestions(items);
  }

  function addQuestion() {
    setQuestions(qs => [...qs, { id: `q-${Date.now()}`, text: '' }]);
  }

  function updateQuestion(id, text) {
    setQuestions(qs => qs.map(q => q.id === id ? { ...q, text } : q));
  }

  function saveTemplate() {
    onSave({ title, questions });
  }

  return (
    <div className="p-4 bg-gray-800 rounded">
      <h2 className="text-xl mb-2">Template Builder</h2>
      <input
        className="w-full mb-4 p-2 bg-gray-700 rounded"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      <button onClick={addQuestion} className="mb-4 px-4 py-2 bg-yellow-500 rounded">Add Question</button>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="questions">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {questions.map((q, index) => (
                <Draggable key={q.id} draggableId={q.id} index={index}>
                  {(prov) => (
                    <div
                      ref={prov.innerRef}
                      {...prov.draggableProps}
                      {...prov.dragHandleProps}
                      className="mb-2 p-2 bg-gray-700 rounded flex items-center"
                    >
                      <span className="mr-2">{index + 1}.</span>
                      <input
                        className="flex-1 p-1 bg-gray-600 rounded"
                        placeholder="Question text"
                        value={q.text}
                        onChange={e => updateQuestion(q.id, e.target.value)}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      <button onClick={saveTemplate} className="mt-4 px-4 py-2 bg-green-500 rounded">Save Template</button>
    </div>
);
}