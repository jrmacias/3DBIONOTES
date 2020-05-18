class Covid19
  def self.selected_entries
    [
      {
        name: "EMD-21375",
        description: "Prefusion 2019-nCoV spike glycoprotein with a single receptor-binding domain up (EMD-21375)",
        image_url: "https://www.ebi.ac.uk/pdbe/static/entry/EMD-21375/400_21375.gif",
        query_url: "/?queryId=EMD-21375&viewer_type=ngl&button=#query",
      },
      {
        name: "EMD-30210",
        description: "The nsp12-nsp7-nsp8 complex bound to the template-primer RNA and triphosphate form of Remdesivir(RTP) (EMD-30210)",
        image_url: "https://www.ebi.ac.uk/pdbe/static/entry/EMD-30210/400_30210.gif",
        query_url: "/?queryId=EMD-30210&viewer_type=ngl&button=#query",
      },
      {
        name: "6LZG",
        description: "Structure of novel coronavirus spike receptor-binding domain complexed with its receptor ACE2",
        image_url: "https://www.ebi.ac.uk/pdbe/static/entry/6lzg_deposited_chain_front_image-200x200.png",
        query_url: "/?queryId=6LZG&viewer_type=ngl&button=#query",
      },
      {
        name: "6W9C",
        description: "The crystal structure of papain-like protease of SARS CoV-2",
        image_url: "https://www.ebi.ac.uk/pdbe/static/entry/6w9c_deposited_chain_front_image-200x200.png",
        query_url: "/?queryId=6W9C&viewer_type=ngl&button=#query",
      },
    ]
  end

  def self.proteins_data
    load_data
  end

  private

  def self.get_pdb_redo_links(title, style, pdb_key, hash, keys)
    entries0 = hash && keys ? (hash.dig(*keys) || []) : []
    entries = entries0.is_a?(Hash) ? [entries0] : entries0

    with_indexes(entries, title).map do |entry, title_indexed|
      name, = entry.values_at("name")
      {
        title: title_indexed,
        name: name,
        style: style,
        query_url: "/?queryId=PDB-REDO-#{pdb_key}&viewer_type=ngl&button=#query",
        external_url: "https://pdb-redo.eu/db/#{name}",
      }
    end
  end

  def self.with_indexes(entries, title)
    append_index = entries.size > 1
    entries.map.with_index(1) { |entry, idx| [entry, append_index ? "#{title} (#{idx})" : title] }
  end

  def self.get_isolde_links(title, style, pdb_key, hash, keys)
    return [] unless hash && keys
    entries = hash.dig(*keys) || []

    with_indexes(entries, title).map do |entry, title_indexed|
      entry_name, uuid = entry.values_at("name", "uuid")
      {
        title: title_indexed,
        name: entry_name,
        style: style,
        query_url: "/?queryId=ISOLDE-#{pdb_key}&uuid=#{uuid}&viewer_type=ngl&button=#query",
      }
    end
  end

  def self.get_related_keys(data)
    case
    when data.is_a?(Array)
      data
    when data.is_a?(Hash)
      data.keys
    else
      []
    end
  end

  def self.to_hash(entries)
    entries.is_a?(Hash) ? entries : entries.map { |key| [key, {}] }.to_h.sort
  end

  def self.parse_pdb(protein, keys)
    entries = protein.dig(*keys) || []
    to_hash(entries).map do |pdb_key, pdb_hash|
      {
        name: pdb_key,
        description: pdb_hash["description"],
        query_url: "/?queryId=#{pdb_key}&viewer_type=ngl&button=#query",
        image_url: "https://www.ebi.ac.uk/pdbe/static/entry/#{pdb_key}_deposited_chain_front_image-200x200.png",
        external: {text: "EBI", url: "https://www.ebi.ac.uk/pdbe/entry/pdb/#{pdb_key}"},
        related: get_related_keys(pdb_hash["emdbs"]),
        links: [
          *get_pdb_redo_links("PDB-Redo", :turq, pdb_key, pdb_hash, ["validation", "pdb-redo"]),
          *get_isolde_links("Isolde", :cyan, pdb_key, pdb_hash, ["validation", "isolde"]),
        ],
      }
    end.compact
  end

  def self.parse_emdb(protein, keys)
    entries = protein.dig(*keys) || []
    to_hash(entries).map do |emdb_key, emdb_hash|
      code = emdb_key.split("-")[1]
      {
        name: emdb_key,
        description: emdb_hash["description"],
        query_url: "/?queryId=#{emdb_key}&viewer_type=ngl&button=#query",
        image_url: "https://www.ebi.ac.uk/pdbe/static/entry/#{emdb_key}/400_#{code}.gif",
        related: get_related_keys(emdb_hash["pdbs"] || emdb_hash["pdb"]),
        external: {text: "EBI", url: "https://www.ebi.ac.uk/pdbe/entry/emdb/#{emdb_key}"},
        links: [],
      }
    end
  end

  def self.parse_swiss_model(protein, keys)
    entries = protein.dig(*keys) || []
    entries.map do |entry|
      project, model, description = entry.values_at("project", "model", "description")
      {
        name: "#{project}-#{model}",
        description: ["project: #{project}", "model: #{model}", description].compact.join(" | "),
        query_url: "/?queryId=SWISS-MODEL-#{project}-#{model}&viewer_type=ngl&button=#query”",
        image_url: "https://swissmodel.expasy.org/interactive/#{project}/models/#{model}.png",
        external: {text: "SWISS-MODEL", url: "https://swissmodel.expasy.org/interactive/#{project}/"},
        links: [],
      }
    end
  end

  def self.parse_alphafold(protein, keys)
    entries = protein.dig(*keys) || []
    entries.map do |entry|
      name, uuid, description = entry.values_at("name", "uuid", "description")
      {
        name: name,
        description: description,
        links: [],
      }
    end
  end

  def self.parse_bsm_arc(protein, keys)
    entries = protein.dig(*keys) || []
    entries.map do |entry|
      model, = entry.values_at("model")
      {
        name: "#{model}",
        links: [],
      }
    end
  end

  def self.parse_db(protein, keys)
    parse_pdb(protein, [*keys, "PDB"]) + parse_emdb(protein, [*keys, "EMDB"])
  end

  def self.load_data
    json_path = File.join(__dir__, "../data/cv-data.json")
    data = JSON.parse(open(json_path).read)
    get_proteins_data(data["SARS-CoV-2 Proteome"])
  end

  def self.card(name, items)
    items.present? ? {name: name, items: items, subsections: []} : nil
  end

  def self.card_wrapper(name, subsections)
    subsections2 = subsections.compact.map { |subsection| subsection.merge(parent: name) }
    subsections2.size > 0 ? {name: name, items: [], subsections: subsections2} : nil
  end

  def self.get_relations(proteins)
    relations_base = proteins.flat_map do |protein|
      protein[:sections].flat_map do |section|
        items = section[:items].map { |item| [item[:name], protein[:name]] }
        subsection_items = section[:subsections].flat_map do |subsection|
          subsection[:items].map { |item| [item[:name], protein[:name]] }
        end
        items + subsection_items
      end
    end

    relations_base.group_by { |k, v| k }.transform_values { |vs| vs.map(&:second).uniq }
  end

  def self.get_proteins_data(proteins_raw)
    proteins = proteins_raw.map do |name, protein|
      {
        name: name,
        names: protein["names"],
        description: protein["description"],
        polyproteins: protein["uniprotAccession"],
        sections: [
          card("PDB", parse_pdb(protein, ["PDB"])),
          card("EMDB", parse_emdb(protein, ["EMDB"])),
          card_wrapper("Interactions", [
            card("P-P Interactions", parse_db(protein, ["Interactions", "P-P-Interactions"])),
            card("Ligands", parse_pdb(protein, ["Interactions", "Ligands"])),
          ]),
          card_wrapper("Related", [
            card("SARS-CoV", parse_db(protein, ["Related", "SARS-CoV"])),
            card("Other", parse_db(protein, ["Related", "OtherRelated"]))
          ]),
          card_wrapper("Computational Models", [
            card("Swiss Model", parse_swiss_model(protein, ["CompModels", "swiss-model"])),
            card("AlphaFold", parse_alphafold(protein, ["CompModels", "AlphaFold"])),
            card("BSM-Arc", parse_bsm_arc(protein, ["CompModels", "BSM-Arc"])),
          ]),
        ].compact,
      }
    end

    {proteins: proteins, relations: get_relations(proteins)}
  end
end
