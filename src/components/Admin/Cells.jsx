import React, { useState ,useRef } from 'react';
import { Reorder, motion } from "framer-motion";

const Cells = ({ col, rowID , tableID, dragOverFunc,hoveredCol,tableIndex ,columnField }) => {

    const spring = {
        type: "spring",
        damping: 20,
        stiffness: 300
      };

    const isHovered =
        hoveredCol &&
        hoveredCol.tableID === tableID &&
        hoveredCol.rowID === rowID &&
        hoveredCol.colID === col.id;

        // console.log("isHovered:", isHovered, hoveredCol, tableID, rowID, col.id);
        return (
        <Reorder.Item
            className="flex flex-col text-center items-center w-full"
            value={col}
            id={col.id}
            onTap={()=>{dragOverFunc(tableID,rowID, col.id,tableIndex)}}
            layout
            transition={spring}
            whileTap={{ scale: 0.95 }}
            
        >
            <motion.div
                className={`flex-1 border border-primary-content p-2 w-full ${
                    col[columnField[1]] && col[columnField[0]] ? "opacity-100" : "opacity-60"
                } ${isHovered ? "!border !border-green-500" : ""}`} 
                layout
                transition={spring}
                key={`inner-${col.id}`}
            >
                {col[columnField[1]] && col[columnField[0]] ? (
                    <>
                        <div className="font-medium">{col[columnField[1]]}</div>
                        <div className="text-sm text-gray-500">{col[columnField[0]]}</div>
                    </>
                ) : (
                    <div className="text-gray-400">- - - - -</div>
                )}
            </motion.div>
        </Reorder.Item>
    );
};

export default Cells;
