import React, { createContext, useContext, useState } from "react";

type AlbumCoverState = {
  albumCoverIsSet: boolean;
  triggerRerender: boolean;
  url: string;
};

const AlbumCoverContext = createContext<{
  state: AlbumCoverState;
  setState: React.Dispatch<React.SetStateAction<AlbumCoverState>>;
}>({
  state: { albumCoverIsSet: false, triggerRerender: false, url: "" },
  setState: () => {},
});

export const AlbumCoverProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [albumCoverIsSet, setAlbumCoverIsSet] = useState<AlbumCoverState>({
    albumCoverIsSet: false,
    triggerRerender: false,
    url: "",
  });

  const voidSetter = (newAlbumCoverState: AlbumCoverState) => {
    console.log("newAlbumCoverState: " + newAlbumCoverState);
    setAlbumCoverIsSet(newAlbumCoverState);
  };

  return (
    <AlbumCoverContext.Provider
      value={{
        state: albumCoverIsSet,
        setState: setAlbumCoverIsSet,
      }}
    >
      {children}
    </AlbumCoverContext.Provider>
  );
};

export function useAlbumCover() {
  return useContext(AlbumCoverContext);
}
