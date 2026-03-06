-- ZKONTROLUJTE: Spusťte tento skript až PO vytvoření tabulek (01_create_training_tables.sql).

-- 1. Naplnění kategorií
INSERT INTO dbo.TRAINING_CATEGORIES (Name) VALUES
('BOZP a PO'),
('IT a Kyberbezpečnost'),
('Rozvoj a Soft Skills'),
('Odborná způsobilost');

-- Uchováme si ID nově vytvořených kategorií pro další vkládání
DECLARE @CatBozp INT = (SELECT ID FROM dbo.TRAINING_CATEGORIES WHERE Name = 'BOZP a PO');
DECLARE @CatIT INT = (SELECT ID FROM dbo.TRAINING_CATEGORIES WHERE Name = 'IT a Kyberbezpečnost');
DECLARE @CatSoft INT = (SELECT ID FROM dbo.TRAINING_CATEGORIES WHERE Name = 'Rozvoj a Soft Skills');
DECLARE @CatOdborna INT = (SELECT ID FROM dbo.TRAINING_CATEGORIES WHERE Name = 'Odborná způsobilost');

-- 2. Naplnění katalogu školení
INSERT INTO dbo.TRAININGS_CATALOG (CategoryID, Name, Description, PeriodicityMonths) VALUES
-- Kategorie: BOZP a PO
(@CatBozp, 'Pravidelné školení BOZP pro zaměstnance', 'Základní školení bezpečnosti ochrany zdraví při práci.', 24),
(@CatBozp, 'Školení požární ochrany', 'Základní školení k postupu při vzniku požáru a prevenci.', 24),
(@CatBozp, 'První pomoc na pracovišti', 'Kurz první pomoci a krizového řízení při úrazech.', 36),
(@CatBozp, 'Práce ve výškách', 'Speciální školení pro práce nad 1,5m výšky.', 12),
(@CatBozp, 'Elektro vyhláška - paragraf 4', 'Školení seznámených pracovníků s elektrickým zařízením.', 36),

-- Kategorie: IT a Kyberbezpečnost
(@CatIT, 'Základy kybernetické bezpečnosti', 'Školení k bezpečnému heslu, phishingu a sociálnímu inženýrství.', 12),
(@CatIT, 'Ochrana osobních údajů (GDPR)', 'Zásady zpracování a ochrany osobních údajů v organizaci.', 24),
(@CatIT, 'Bezpečná práce z domova (Home Office)', 'Specifická rizika a IT bezpečnost při práci na dálku.', 24),

-- Kategorie: Rozvoj a Soft Skills
(@CatSoft, 'Komunikační dovednosti a asertivita', 'Efektivní komunikace v týmu a s klienty.', 36),
(@CatSoft, 'Vyjednávací techniky (Základní úroveň)', 'Školení prodejců a nákupčích k základům pro vyjednávání.', 24),
(@CatSoft, 'Time management a prioritaizace', 'Správa času pro zefektivnění práce.', 36),
(@CatSoft, 'Zvládání stresu a řešení konfliktů', 'Předcházení vyhoření a zvládání krizových komunikačních situací.', 36),

-- Kategorie: Odborná způsobilost
(@CatOdborna, 'Řidiči referentských vozidel', 'Školení pro řidiče služebních vozidel do 3.5t.', 12),
(@CatOdborna, 'Školení manipulátorů VZV (Nízkozdvižný vozík)', 'Oprávnění pro jízdu s VZV třídy I.', 12),
(@CatOdborna, 'Jeřábnictví a vazačství', 'Licence pro manipulaci a vazbu těžkých břemen pomocí jeřábu.', 12),
(@CatOdborna, 'Školení pro auditory kvality (ISO 9001)', 'Udržování kvalitativních norem.', 24),
(@CatOdborna, 'Bezpečná práce s chemickými látkami', 'Manipulace s nebezpečnými materiály v organizaci.', 12);
