module ProteinManager
  module FetchSequenceInfo

    include InfoManager::SourceUniprotInfo::UniprotSites

    def fetchUniprotSequence(uniprotAc)
      begin
        data = `/external/ncbi-blast/bin/blastdbcmd -entry #{uniprotAc} -db /external/db-blast/sprot/sprot`
        if data.length == 0
          data = `/external/ncbi-blast/bin/blastdbcmd -entry #{uniprotAc} -db /external/db-blast/trembl/trembl`
        end
        if data.length == 0
          data = Net::HTTP.get_response(URI.parse(UniprotURL+uniprotAc+".fasta")).body
        end
      rescue
        puts "Error: #{$!}"
      end
      fasta = Bio::FastaFormat.new(data)
      return fasta
    end

    def __fetchUniprotMultipleSequences(uniprotAc)
      returnValue = {}
      begin

        data = `/external/ncbi-blast/bin/blastdbcmd -entry #{uniprotAc} -db /external/db-blast/sprot/sprot`
        if data.length == 0
          data = `/external/ncbi-blast/bin/blastdbcmd -entry #{uniprotAc} -db /external/db-blast/trembl/trembl`
        end
        if data.length == 0
          if uniprotAc.split(",").length > 1
            data = Net::HTTP.get_response(URI.parse(UniprotURL+"?query="+uniprotAc+"&format=fasta")).body
          else
            data = Net::HTTP.get_response(URI.parse(UniprotURL+uniprotAc+".fasta")).body
          end
        end

      rescue
        puts "Error: #{$!}"
        data = 404
      end
      fasta = nil
      if data != "404"
        fasta = Bio::Alignment::MultiFastaFormat.new(data)
      end
      fasta.entries.each do |entry|
        definition = ""
        accession = ""
        if entry.definition =~/sp/
          definition = entry.definition.split(/\|/)[2].split(/\sOS=/)[0].split(/\s/,2)[1].upcase
          accession = entry.accession
        else
          aux = entry.definition
          accession = aux.split(/\s/)[0]
          aux = aux.sub  "\s" , "|"
          definition = aux.split(/\|/)[1].split(/\sOS=/)[0].split(/\s/,2)[1].upcase
        end
        returnValue[accession] = [entry.seq.length,definition]
      end
      return render json: returnValue, status: :ok
    end

    def fetchUniprotMultipleSequences(uniprotAc,fasta_obj_flag=nil,dict_flag=nil)
      returnValue = {}
      begin
        if uniprotAc.split(",").length > 1
          data = Net::HTTP.get_response(URI.parse(UniprotURL+"?query="+uniprotAc+"&format=fasta"))
        else
          data = Net::HTTP.get_response(URI.parse(UniprotURL+uniprotAc+".fasta"))
        end
      rescue
        puts "Error: #{$!}"
      end
      fasta = nil
      if data.code != "404"
        fasta = Bio::Alignment::MultiFastaFormat.new(data.body)
        if !fasta_obj_flag.nil?
          return fasta
        end
      end
      if !fasta.nil? && !fasta.entries.nil?
        fasta.entries.each do |entry|
          entry_definition = "Unknown"
          if !entry.definition.nil? and entry.definition.include? "|" and entry.definition.include? "OS="
            aux = entry.definition.split(/\|/)[2].split(/\sOS=/)
            entry_definition = aux[0].split(/\s/,2)[1]
            aux = aux[1].split(/ GN=/,2)
            organism_name = aux[0]
            gene_symbol = "N/A"
            if !aux[1].nil?
              gene_symbol = aux[1].split(/ PE=/,2)[0]
            else
              organism_name = organism_name.split(/ PE=/,2)[0]
            end
          end
          if dict_flag.nil?
            returnValue[entry.accession] = [entry.seq.length,entry_definition,gene_symbol,organism_name]
          else
            returnValue[ entry.accession ] = {'sequence'=>entry.seq,'definition'=>entry_definition,'organism'=>organism_name, 'gene_symbol'=>gene_symbol}
          end
        end
      end
      return returnValue
    end

  end
end
