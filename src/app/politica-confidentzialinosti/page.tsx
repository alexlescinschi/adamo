export default function PrivacyPage() {
  return (
    <div className="py-[70px] max-w-3xl">
      <h1 className="text-[34px] font-semibold tracking-[-0.031em] text-[#1d1d1f] mb-8">Politica de confidențialitate</h1>
      <div className="text-sm text-[#6b6c6c] space-y-4 leading-relaxed">
        <p>
          Adamo SRL respectă confidențialitatea datelor personale ale consumatorilor săi. 
          Prezenta politică explică modul în care colectăm, utilizăm și protejăm informațiile 
          personale.
        </p>
        <h2 className="text-base font-semibold text-[#1d1d1f] mt-6">Date colectate</h2>
        <p>
          Colectăm doar datele necesare pentru procesarea comenzilor: nume, prenume, 
          adresă de email, număr de telefon și adresa de livrare.
        </p>
        <h2 className="text-base font-semibold text-[#1d1d1f] mt-6">Scopul prelucrării</h2>
        <p>
          Datele personale sunt utilizate exclusiv pentru procesarea și livrarea comenzilor, 
          comunicarea cu clienții și îmbunătățirea serviciilor noastre.
        </p>
        <h2 className="text-base font-semibold text-[#1d1d1f] mt-6">Protecția datelor</h2>
        <p>
          Implementăm măsuri tehnice și organizatorice adecvate pentru a proteja datele 
          personale împotriva accesului neautorizat, pierderii sau divulgării.
        </p>
        <h2 className="text-base font-semibold text-[#1d1d1f] mt-6">Contact</h2>
        <p>
          Pentru întrebări legate de confidențialitate, ne puteți contacta la 
          <a href="mailto:adamomoldova@gmail.com" className="text-[#4e8f28] hover:underline"> adamomoldova@gmail.com</a>.
        </p>
      </div>
    </div>
  );
}
