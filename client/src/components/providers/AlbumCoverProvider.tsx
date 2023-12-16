import React, { createContext, useContext, useState } from "react";

const AlbumCoverContext = createContext<{
  albumCoverUri: string | null;
  setAlbumCoverUri: (_: string) => void;
}>({ albumCoverUri: "", setAlbumCoverUri: (_: string) => {} });

export const AlbumCoverProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [albumCoverUri, setAlbumCoverUri] = useState<string | null>(null);

  const voidSetter = (newAlbumCoverUri: string | null) => {
    setAlbumCoverUri(newAlbumCoverUri);
  };

  return (
    <AlbumCoverContext.Provider
      value={{ albumCoverUri: albumCoverUri, setAlbumCoverUri: voidSetter }}
    >
      {children}
    </AlbumCoverContext.Provider>
  );
};

export function useAlbumCover() {
  return useContext(AlbumCoverContext);
}
