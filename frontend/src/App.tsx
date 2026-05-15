import { useState } from "react";
import { DiscoveryScreen } from "./screens/DiscoveryScreen";
import { IntelligenceView } from "./screens/IntelligenceView";
import type { Borrower } from "./types/borrower";
import "./App.css";

export default function App() {
  const [selectedBorrower, setSelectedBorrower] = useState<Borrower | null>(null);

  return (
    <>
      <DiscoveryScreen onSelect={setSelectedBorrower} />
      
      {selectedBorrower && (
        <IntelligenceView
          borrower={selectedBorrower}
          onBack={() => setSelectedBorrower(null)}
        />
      )}
    </>
  );
}
