import React, { useState } from "react";

// context for the drag
const DragContext = React.createContext<any>(null);

// drag context component
function Drag({ draggable = true, handleDrop, children }: any) {
  const [dragType, setDragType] = useState<string | null>(null);
  const [dragItem, setDragItem] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [drop, setDrop] = useState<string | null>(null);
  
  React.useEffect(() => {
    if (dragItem) {
      document.body.style.cursor = "grabbing";
    } else {
      document.body.style.cursor = "default";
    }
  }, [dragItem]);
  
  const dragStart = function(e: any, dragId: string, dragType: string) {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'move';
    setDragItem(dragId);
    setDragType(dragType);
  };
  
  const drag = function(e: any) {
    e.stopPropagation();
    setIsDragging(true);
  };

  const dragEnd = function() {
    setDragItem(null);
    setDragType(null);
    setIsDragging(false);
    setDrop(null);
  };

  const onDrop = function(e: any) {
    e.preventDefault();
    handleDrop({ dragItem, dragType, drop });
    setDragItem(null);
    setDragType(null);
    setIsDragging(false);
    setDrop(null);
  };

  return (
    <DragContext.Provider value={{ draggable, dragItem, dragType, isDragging, dragStart, drag, dragEnd, drop, setDrop, onDrop }}>
      { typeof children === "function" ? children({ activeItem: dragItem, activeType: dragType, isDragging }) : children }
    </DragContext.Provider>
  );
}

// a draggable item
const DragItem = function({ dragId, dragType, ...props }: any) {
  const { draggable, dragStart, drag, dragEnd } = React.useContext(DragContext);
  
  return <div onDragStart={(e) => dragStart(e, dragId, dragType)} onDrag={drag} draggable={draggable} onDragEnd={dragEnd} {...props} />;
};

// listens for drags over drop zones
const DropZone = function({ dropId, dropType, remember, children, style, ...props }: any) {
  const { dragItem, dragType, setDrop, drop, onDrop } = React.useContext(DragContext);
  
  function handleDragOver(e: any) {
    if (e.preventDefault) {
      e.preventDefault();
    }
    return false;
  }
  
  function handleLeave() {
    if (!remember) {
      setDrop(null); 
    }
  }

  return ( 
    <div onDragEnter={() => dragItem && dropType === dragType && setDrop(dropId)} onDragOver={handleDragOver} onDrop={onDrop} style={{position: "relative", ...style}} {...props}>
      { children }
      { drop === dropId && <div style={{position: "absolute", inset: "0px"}} onDragLeave={handleLeave}></div> }
    </div>
  );
};

// if we need multiple dropzones
const DropZones = function({ dropType, prevId, nextId, split = "y", remember, children, ...props }: any) {
  const { dragType, isDragging } = React.useContext(DragContext);
  return (
    <div style={{position: "relative"}} {...props}>
      { children }
      { dragType === dropType && isDragging &&
        <div style={{position: "absolute", inset: "0px", display: "flex", flexDirection: split === "x" ? "row" : "column" }}>
          <DropZone dropId={prevId} style={{ width: "100%", height: "100%" }} dropType={dropType} remember={remember} />
          <DropZone dropId={nextId} style={{ width: "100%", height: "100%" }} dropType={dropType} remember={remember} />
        </div>
      }
    </div>
  );
};

// indicates where the drop will go when dragging over a dropzone
const DropGuide = function({ dropId, dropType, ...props }: any) {
    const { drop, dragType } = React.useContext(DragContext);
    return dragType === dropType && drop === dropId ? <div {...props} /> : null;
};

// the dummy Trello-style content
const dummyData = [
  { id: 1, name: "List 1", cards: [ 
    { id: 1, title: "Card 1" },
    { id: 2, title: "Card 2" },
    { id: 3, title: "Card 3" },
    { id: 4, title: "Card 4" },
    { id: 5, title: "Card 5" },
  ] },
  { id: 2, name: "List 2", cards: [ 
    { id: 6, title: "Card 6" },
    { id: 7, title: "Card 7" },
    { id: 8, title: "Card 8" },
  ] },
];

function Card({ title, description = "Drag and drop me!", dragItem }: any) {
  return (
    <div className={`rounded-lg bg-white border border-gray-300 shadow-sm p-5 m-2${ dragItem ? " rotate-6" : ""}`}>
      <h3 className="font-bold text-lg my-1">{ title }</h3>
      <p>{ description }</p>
    </div>
  );
}

function List({ name, dragItem, children }: any) {
  return (
    <div className={`rounded-xl bg-gray-100 p-2 mx-2 my-5 w-80 shrink-0 grow-0 shadow${ dragItem ? " rotate-6" : ""}`}>
      <div className="px-6 py-1">
        <h2 className="font-bold text-xl my-1">{ name }</h2>
      </div>
      { children }
    </div>
  );
}

// app component
export function CodepenDemo() {
  const [data, setData] = useState(dummyData);

  // handle a dropped item
  function handleDrop({ dragItem, dragType, drop }: any) {
    if (dragType === "card") {
      // get the drop position as numbers
      let [newListPosition, newCardPosition] = drop.split("-").map((string: string) => parseInt(string));
      // create a copy for the new data
      let newData = structuredClone(data); // deep clone
      // find the current positions
      let oldCardPosition: number;
      let oldListPosition = data.findIndex((list) => {
        oldCardPosition = list.cards.findIndex((card) => card.id === dragItem);
        return oldCardPosition >= 0;
      });
      // get the card
      let card = data[oldListPosition].cards[oldCardPosition!];
      // if same array and current position before drop reduce drop position by one
      if (newListPosition === oldListPosition && oldCardPosition! < newCardPosition) {
        newCardPosition--; // reduce by one
      }
      // remove the card from the old position
      newData[oldListPosition].cards.splice(oldCardPosition!, 1);
      // put it in the new position
      newData[newListPosition].cards.splice(newCardPosition, 0, card);
      // update the state
      setData(newData);
    } else if (dragType === "list") {
      let newListPosition = drop;
      let oldListPosition = data.findIndex((list) => list.id === dragItem);
      // create a copy for the new data
      let newData = structuredClone(data); // deep clone
      // get the list
      let list = data[oldListPosition];
      // if current position before drop reduce drop position by one
      if (oldListPosition < newListPosition) {
        newListPosition--; // reduce by one
      }
      // remove list from the old position
      newData.splice(oldListPosition, 1);
      // put it in the new position
      newData.splice(newListPosition, 0, list);
      // update the state
      setData(newData);
    }
  }
  
  return (
    <div className="p-10 flex flex-col border-4 border-purple-500 rounded-lg bg-purple-50 dark:bg-purple-950">
      <h1 className="font-semibold text-3xl py-2 text-purple-900 dark:text-purple-100">Codepen Demo - Trello-Style Drag & Drop</h1>
      <p className="text-purple-700 dark:text-purple-300 mb-4">This is the working codepen example rendered directly!</p>
      <Drag handleDrop={handleDrop}>
        {({ activeItem, activeType, isDragging }: any) => (
          <DropZone className="flex -mx-2 overflow-x-scroll h-full">
            {data.map((list, listPosition) => {
              return (
                <React.Fragment key={list.id}>
                  <DropZone dropId={listPosition} dropType="list" remember={true}>
                    <DropGuide dropId={listPosition} dropType="list" className="rounded-xl bg-gray-200 h-96 mx-2 my-5 w-80 shrink-0 grow-0" />
                  </DropZone>
                  <DropZones className="flex flex-col h-full" prevId={listPosition} nextId={listPosition+1} dropType="list" split="x" remember={true}>
                    <DragItem dragId={list.id} className={`cursor-pointer ${activeItem === list.id && activeType === "list" && isDragging ? "hidden" : "translate-x-0"}`} dragType="list">
                      <List name={list.name} dragItem={activeItem === list.id && activeType === "list"}>
                        {data[listPosition].cards.map((card, cardPosition) => {
                          return (
                            <DropZones key={card.id} prevId={`${listPosition}-${cardPosition}`} nextId={`${listPosition}-${cardPosition+1}`} dropType="card" remember={true}>
                              <DropGuide dropId={`${listPosition}-${cardPosition}`} className="rounded-lg bg-gray-200 h-24 m-2" dropType="card" />
                              <DragItem dragId={card.id} className={`cursor-pointer ${activeItem === card.id && activeType === "card" && isDragging ? "hidden" : "translate-x-0"}`} dragType="card">
                                <Card title={card.title} dragItem={activeItem === card.id && activeType === "card"} />
                              </DragItem>
                            </DropZones>
                          );
                        })}
                        <DropZone dropId={`${listPosition}-${data[listPosition].cards.length}`} dropType="card" remember={true}>
                          <DropGuide dropId={`${listPosition}-${data[listPosition].cards.length}`} className="rounded-lg bg-gray-200 h-24 m-2" dropType="card" />
                        </DropZone>
                      </List>
                    </DragItem>
                    <DropZone dropId={`${listPosition}-${data[listPosition].cards.length}`} className="grow" dropType="card" remember={true} />
                  </DropZones>
                </React.Fragment>
              );
            })}
            <DropZone dropId={data.length} dropType="list" remember={true}>
              <DropGuide dropId={data.length} dropType="list" className="rounded-xl bg-gray-200 h-96 mx-2 my-5 w-80 shrink-0 grow-0" />
            </DropZone>
          </DropZone>
        )}
      </Drag>
    </div>
  );
}
